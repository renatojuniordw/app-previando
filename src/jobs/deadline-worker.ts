import { Worker, Queue } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { Logger } from '../lib/logger'
import { hasCalendarAccess, syncCaseDeadlinesToCalendar } from '../services/google-calendar'

const logger = new Logger('DeadlineWorker')

export function createDeadlineWorker(redis: Redis): Worker {
  const conn = redis as unknown as ConnectionOptions
  const worker = new Worker(
    'deadline-notifications',
    async () => {
      const now = new Date()
      const thresholds = [
        { days: 1, type: 'DEADLINE_1D' as const },
        { days: 3, type: 'DEADLINE_3D' as const },
        { days: 7, type: 'DEADLINE_7D' as const },
      ]

      for (const { days, type } of thresholds) {
        const windowStart = new Date(now)
        windowStart.setDate(windowStart.getDate() + days)
        windowStart.setHours(0, 0, 0, 0)

        const windowEnd = new Date(windowStart)
        windowEnd.setHours(23, 59, 59, 999)

        const cases = await prisma.case.findMany({
          where: {
            deadlineDate: { gte: windowStart, lte: windowEnd },
            status: { notIn: ['FINISHED'] },
          },
          select: {
            id: true,
            userId: true,
            deadlineDate: true,
            benefitType: true,
            client: { select: { name: true } },
          },
        })

        for (const c of cases) {
          const dateStr = c.deadlineDate!.toLocaleDateString('pt-BR')
          const alreadyExists = await prisma.notification.findFirst({
            where: { userId: c.userId, caseId: c.id, type, createdAt: { gte: windowStart } },
          })
          if (alreadyExists) continue

          await prisma.notification.create({
            data: {
              userId: c.userId,
              caseId: c.id,
              type,
              message: `Prazo do caso de ${c.client.name} vence em ${days} dia${days > 1 ? 's' : ''} (${dateStr}).`,
            },
          })
        }
        // Sincroniza prazos com Google Calendar
        const syncUserIds = Array.from(new Set(cases.map((c: { userId: string }) => c.userId)))
        for (const uid of syncUserIds) {
          try {
            const synced = await syncCaseDeadlinesToCalendar(uid)
            if (synced > 0) {
              logger.info(`Synced ${synced} deadlines to Google Calendar for user ${uid}`)
            }
          } catch {
            logger.warn(`Failed to sync Google Calendar for user ${uid}`)
          }
        }
      }

      logger.info('Deadline notification job completed')
    },
    { connection: conn, concurrency: 1 }
  )

  worker.on('failed', (job, err) => {
    logger.error(`Deadline job ${job?.id} failed`, err)
  })

  return worker
}

export async function scheduleDeadlineJob(redis: Redis): Promise<void> {
  const conn = redis as unknown as ConnectionOptions
  const deadlineQueue = new Queue('deadline-notifications', { connection: conn })

  const repeatableJobs = await deadlineQueue.getRepeatableJobs()
  const alreadyScheduled = repeatableJobs.some((j) => j.name === 'daily-deadline-check')
  if (!alreadyScheduled) {
    await deadlineQueue.add('daily-deadline-check', {}, {
      repeat: { pattern: '0 8 * * *' },
      removeOnComplete: true,
    })
    logger.info('Scheduled daily deadline check job at 08:00')
  }
}
