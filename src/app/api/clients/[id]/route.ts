import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership } from '@/lib/ownership'
import { sanitizeInput, sanitizePhone } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  birthDate: z.string().datetime().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).optional(),
  notes: z.string().max(2000).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyClientOwnership(params.id, session.user.id)

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        cases: {
          orderBy: { createdAt: 'desc' },
          include: { cnisDocument: { select: { processingStatus: true } } },
        },
      },
    })

    if (!client) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })

    const safe = { ...client } as Record<string, unknown>
    delete safe.cpfHash
    return NextResponse.json({ client: { ...safe, cpf: '***.***.**-**' } })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyClientOwnership(params.id, session.user.id)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
    }

    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.name) data.name = sanitizeInput(parsed.data.name)
    if (parsed.data.birthDate) data.birthDate = new Date(parsed.data.birthDate)
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone ? sanitizePhone(parsed.data.phone) : null
    if (parsed.data.email !== undefined) data.email = parsed.data.email || null
    if (parsed.data.priority) data.priority = parsed.data.priority
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes ? sanitizeInput(parsed.data.notes) : null

    const client = await prisma.client.update({ where: { id: params.id }, data })
    const safe = { ...client } as Record<string, unknown>
    delete safe.cpfHash
    return NextResponse.json({ client: { ...safe, cpf: '***.***.**-**' } })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyClientOwnership(params.id, session.user.id)

    await prisma.client.delete({ where: { id: params.id } })

    await prisma.usageRecord.update({
      where: { userId: session.user.id },
      data: { totalClients: { decrement: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
