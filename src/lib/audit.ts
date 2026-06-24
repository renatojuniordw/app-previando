import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import { Logger } from './logger'

const logger = new Logger('AuditLog')

interface AuditParams {
  userId: string
  action: string
  resource: string
  req?: NextRequest
  metadata?: Record<string, unknown>
}

export async function logAudit({ userId, action, resource, req, metadata }: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        ipAddress:
          req?.headers.get('cf-connecting-ip') ??
          req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          null,
        userAgent: req?.headers.get('user-agent') ?? null,
        metadata: (metadata ?? null) as never,
      },
    })
  } catch (err) {
    // Falha em auditoria não deve interromper o fluxo principal
    logger.error('Failed to write audit log', err)
  }
}
