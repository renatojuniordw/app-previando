import { Worker, Queue } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { Logger } from '../lib/logger'
import { computeFeeStatus } from '../lib/fee-status'

const logger = new Logger('FeeWorker')

export function createFeeWorker(redis: Redis): Worker {
  const conn = redis as unknown as ConnectionOptions
  const worker = new Worker(
    'fee-notifications',
    async () => {
      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)

      // Honorários com saldo em aberto (PENDING/PARTIAL/OVERDUE) e vencimento definido.
      const openFees = await prisma.fee.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          dueDate: { not: null },
        },
        select: {
          id: true, totalAmount: true, paidAmount: true, dueDate: true, status: true,
          description: true,
          case: { select: { id: true, userId: true, client: { select: { name: true } } } },
        },
      })

      let overdueCount = 0
      for (const fee of openFees) {
        const nextStatus = computeFeeStatus({
          totalAmount: Number(fee.totalAmount),
          paidAmount: Number(fee.paidAmount),
          dueDate: fee.dueDate,
        })

        if (nextStatus !== fee.status) {
          await prisma.fee.update({ where: { id: fee.id }, data: { status: nextStatus } })
          overdueCount++
        }

        if (nextStatus === 'OVERDUE' && fee.status !== 'OVERDUE') {
          // Vencimento acabou de virar OVERDUE nesta execução: notifica uma vez.
          await prisma.notification.create({
            data: {
              userId: fee.case.userId,
              caseId: fee.case.id,
              type: 'FEE_OVERDUE',
              message: `Honorário "${fee.description}" de ${fee.case.client.name} está atrasado.`,
            },
          })
        }
      }

      // Alerta 3 dias antes do vencimento, uma vez por honorário/janela.
      const windowStart = new Date(todayStart)
      windowStart.setDate(windowStart.getDate() + 3)
      const windowEnd = new Date(windowStart)
      windowEnd.setHours(23, 59, 59, 999)

      const dueSoonFees = await prisma.fee.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { gte: windowStart, lte: windowEnd },
        },
        select: {
          id: true, description: true,
          case: { select: { id: true, userId: true, client: { select: { name: true } } } },
        },
      })

      for (const fee of dueSoonFees) {
        const alreadyExists = await prisma.notification.findFirst({
          where: {
            userId: fee.case.userId,
            caseId: fee.case.id,
            type: 'FEE_DUE_SOON',
            message: { contains: fee.description },
            createdAt: { gte: todayStart },
          },
        })
        if (alreadyExists) continue

        await prisma.notification.create({
          data: {
            userId: fee.case.userId,
            caseId: fee.case.id,
            type: 'FEE_DUE_SOON',
            message: `Honorário "${fee.description}" de ${fee.case.client.name} vence em 3 dias.`,
          },
        })
      }

      logger.info(`Fee notification job completed (${overdueCount} honorários marcados como atrasados)`)
    },
    { connection: conn, concurrency: 1 }
  )

  worker.on('failed', (job, err) => {
    logger.error(`Fee job ${job?.id} failed`, err)
  })

  return worker
}

export async function scheduleFeeJob(redis: Redis): Promise<void> {
  const conn = redis as unknown as ConnectionOptions
  const feeQueue = new Queue('fee-notifications', { connection: conn })

  const repeatableJobs = await feeQueue.getRepeatableJobs()
  const alreadyScheduled = repeatableJobs.some((j) => j.name === 'daily-fee-check')
  if (!alreadyScheduled) {
    await feeQueue.add('daily-fee-check', {}, {
      repeat: { pattern: '0 8 * * *' },
      removeOnComplete: true,
    })
    logger.info('Scheduled daily fee check job at 08:00')
  }
}
