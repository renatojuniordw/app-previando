import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import { Logger } from './logger'
import { Queue } from 'bullmq'
import { bullmqConnection } from './redis'
import { getClientIp } from './request-ip'
import { computeEntryHash } from './audit-hash'

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
    auditQueue = new Queue('audit-log', { connection: bullmqConnection })
  }
  return auditQueue
}

export async function logAudit({ userId, action, resource, req, metadata }: AuditParams): Promise<void> {
  const jobData: AuditJobData = {
    userId,
    action,
    resource,
    ipAddress: req ? getClientIp(req) : null,
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
    await prisma.$transaction(async (tx) => {
      // Trava a única linha de estado da cadeia — serializa os até 10 workers
      // concorrentes (ver audit-worker.ts) para que o encadeamento nunca bifurque.
      const [state] = await tx.$queryRaw<{ lastHash: string }[]>`
        SELECT "lastHash" FROM "audit_chain_state" WHERE id = 1 FOR UPDATE
      `
      const previousHash = state?.lastHash ?? 'genesis'
      const createdAt = new Date()
      const hash = computeEntryHash(previousHash, data, createdAt)

      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          createdAt,
          previousHash,
          hash,
        },
      })

      await tx.auditChainState.update({ where: { id: 1 }, data: { lastHash: hash } })
    })
  } catch (err) {
    // P2003 = FK constraint — user was deleted after the job was enqueued; skip silently
    if ((err as { code?: string })?.code === 'P2003') return
    logger.error('Failed to write audit log', err)
  }
}

export interface AuditChainVerificationResult {
  valid: boolean
  checkedCount: number
  brokenAtId?: string
}

/**
 * Recalcula a cadeia de hashes do zero e confere contra o que está gravado.
 * Se alguém alterar ou apagar uma linha diretamente no banco, a cadeia quebra
 * a partir dali — é a "prova de integridade" do prontuário/trilha de auditoria.
 */
export async function verifyAuditChainIntegrity(): Promise<AuditChainVerificationResult> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, userId: true, action: true, resource: true,
      ipAddress: true, userAgent: true, metadata: true,
      createdAt: true, previousHash: true, hash: true,
    },
  })

  let expectedPrevious = 'genesis'
  let checkedCount = 0

  for (const log of logs) {
    // Registros anteriores à introdução do hash encadeado não têm o que verificar
    if (log.hash === null) continue

    // A continuidade da cadeia (previousHash → hash) é sempre verificável e
    // pega qualquer linha inserida, removida ou reordenada fora da aplicação.
    if (log.previousHash !== expectedPrevious) {
      return { valid: false, checkedCount, brokenAtId: log.id }
    }

    // O conteúdo só é re-verificável por completo se o userId original ainda
    // está intacto. Quando a conta é excluída, AuditLog.userId vira NULL por
    // design (ver M6 — a trilha sobrevive à exclusão da conta), uma mutação
    // legítima da aplicação que não deve ser confundida com adulteração.
    // Ainda assim a cadeia continua a partir do hash já gravado (imutável).
    if (log.userId !== null) {
      const recomputed = computeEntryHash(
        expectedPrevious,
        {
          userId: log.userId,
          action: log.action,
          resource: log.resource,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata ?? undefined,
        },
        log.createdAt
      )

      if (recomputed !== log.hash) {
        return { valid: false, checkedCount, brokenAtId: log.id }
      }
    }

    expectedPrevious = log.hash
    checkedCount++
  }

  return { valid: true, checkedCount }
}
