import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { sanitizeInput } from '@/lib/sanitize-server'
import { logAudit } from '@/lib/audit'

const schema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED']).optional(),
  adminNotes: z.string().max(5000).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.status) data.status = parsed.data.status
    if (parsed.data.adminNotes !== undefined) data.adminNotes = sanitizeInput(parsed.data.adminNotes)

    const ticket = await prisma.supportTicket.update({
      where: { id: params.id },
      data,
      select: { id: true, subject: true, status: true, adminNotes: true, updatedAt: true },
    })

    await logAudit({
      userId: adminResult.userId,
      action: 'support.ticket.updated',
      resource: ticket.id,
      req,
      metadata: { status: parsed.data.status },
    })

    return NextResponse.json({ ticket })
  } catch (err) {
    return handleApiError(err)
  }
}
