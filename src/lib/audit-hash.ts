import { createHash } from 'crypto'
import type { AuditJobData } from './audit'

/**
 * Computes SHA-256 hash of an audit entry for chain integrity.
 * Pure function — deterministic for same inputs.
 */
export function computeEntryHash(previousHash: string, data: AuditJobData, createdAt: Date): string {
  const payload = JSON.stringify({
    previousHash,
    userId: data.userId,
    action: data.action,
    resource: data.resource,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    metadata: data.metadata ?? null,
    createdAt: createdAt.toISOString(),
  })
  return createHash('sha256').update(payload).digest('hex')
}
