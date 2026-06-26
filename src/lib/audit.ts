import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import { Logger } from './logger'
import { Queue } from 'bullmq'
import { redis } from './redis'

const logger = new Logger('AuditLog')

export interface AuditJobData {
  userId: string
  action: string
  resource: string
  ipAddress: string | null
  userAgent: string | null
  metadata?: unknown
}

interface AuditParams {
  userId: string
  action: string
  resource: string
  req?: NextRequest
  metadata?: unknown
}

let auditQueue: Queue | null = null

function getAuditQueue(): Queue {
  if (!auditQueue) {
    auditQueue = new Queue('audit-log', { connection: redis as any })
  }
  return auditQueue
}

export async function logAudit({ userId, action, resource, req, metadata }: AuditParams): Promise<void> {
  const jobData: AuditJobData = {
    userId,
    action,
    resource,
    ipAddress:
      req?.headers.get('cf-connecting-ip') ??
      req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      null,
    userAgent: req?.headers.get('user-agent') ?? null,
    metadata,
  }

  try {
    await getAuditQueue().add('write-audit', jobData)
  } catch {
    // Fallback síncrono se a queue não estiver disponível
    await writeAuditDirect(jobData)
  }
}

export async function writeAuditDirect(data: AuditJobData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
  } catch (err) {
    logger.error('Failed to write audit log', err)
  }
}
