import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { verifyAuditChainIntegrity } from '@/lib/audit'
import { handleApiError } from '@/lib/api-error'

/**
 * GET /api/admin/audit-integrity
 * Recalcula a cadeia de hashes da trilha de auditoria e confirma que nenhuma
 * linha foi alterada/removida fora da aplicação — "prova de integridade".
 */
export async function GET() {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) return adminCheck.error

    const result = await verifyAuditChainIntegrity()
    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err)
  }
}
