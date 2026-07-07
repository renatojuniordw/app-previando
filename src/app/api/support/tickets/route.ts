import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { sanitizeInput } from '@/lib/sanitize-server'
import { logAudit } from '@/lib/audit'

const schema = z.object({
  subject: z.string().min(5, 'Mínimo 5 caracteres').max(200),
  message: z.string().min(10, 'Mínimo 10 caracteres').max(5000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

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

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: sanitizeInput(parsed.data.subject),
        message: sanitizeInput(parsed.data.message),
        priority: parsed.data.priority,
      },
      select: { id: true, subject: true, status: true, createdAt: true },
    })

    await logAudit({
      userId: session.user.id,
      action: 'support.ticket.created',
      resource: ticket.id,
      req,
      metadata: { subject: ticket.subject },
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
