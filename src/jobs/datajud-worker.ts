import { Worker, Queue } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { queryProcess } from '../services/datajud'
import { Logger } from '../lib/logger'

const logger = new Logger('DatajudWorker')

export function createDatajudWorker(redis: Redis): Worker {
  const worker = new Worker(
    'datajud-monitor',
    async () => {
      const cases = await prisma.case.findMany({
        where: {
          processNumber: { not: null },
          status: { notIn: ['FINISHED'] },
        },
        select: {
          id: true,
          userId: true,
          processNumber: true,
          processLastMovCount: true,
          client: { select: { name: true } },
        },
      })

      logger.info(`Monitorando ${cases.length} processos no DataJud`)

      for (const c of cases) {
        if (!c.processNumber) continue

        try {
          const result = await queryProcess(c.processNumber)
          if (!result.found || !result.data) continue

          const newCount = result.data.totalMovimentacoes
          const prevCount = c.processLastMovCount ?? 0

          if (newCount > prevCount) {
            const lastMov = result.data.ultimaMovimentacao

            await prisma.case.update({
              where: { id: c.id },
              data: {
                processLastMovCount: newCount,
                processLastCheck: new Date(),
                processLastMovDate: lastMov?.data ? new Date(lastMov.data) : undefined,
                processLastSummary: lastMov?.descricao ?? null,
              },
            })

            const alreadyExists = await prisma.notification.findFirst({
              where: {
                userId: c.userId,
                caseId: c.id,
                type: 'PROCESS_UPDATE',
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              },
            })

            if (!alreadyExists) {
              const movDesc = lastMov?.descricao
                ? ` Última movimentação: "${lastMov.descricao}".`
                : ''
              await prisma.notification.create({
                data: {
                  userId: c.userId,
                  caseId: c.id,
                  type: 'PROCESS_UPDATE',
                  message: `Nova movimentação no processo de ${c.client.name} (${newCount - prevCount} nova${newCount - prevCount > 1 ? 's' : ''}).${movDesc}`,
                },
              })
            }
          } else {
            await prisma.case.update({
              where: { id: c.id },
              data: { processLastCheck: new Date() },
            })
          }
        } catch (err) {
          logger.warn(`Falha ao monitorar processo ${c.processNumber}`, err)
        }
      }

      logger.info('DataJud monitoring job completed')
    },
    { connection: redis, concurrency: 1 }
  )

  worker.on('failed', (job, err) => {
    logger.error(`DataJud job ${job?.id} failed`, err)
  })

  return worker
}

export async function scheduleDatajudJob(redis: Redis): Promise<void> {
  const queue = new Queue('datajud-monitor', { connection: redis })

  const existing = await queue.getRepeatableJobs()
  const alreadyScheduled = existing.some((j) => j.name === 'daily-datajud-check')

  if (!alreadyScheduled) {
    await queue.add('daily-datajud-check', {}, {
      repeat: { pattern: '0 9 * * *' },
      removeOnComplete: true,
    })
    logger.info('Scheduled daily DataJud monitor job at 09:00')
  }
}
