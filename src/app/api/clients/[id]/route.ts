import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership } from '@/lib/ownership'
import { sanitizeInput, sanitizePhone } from '@/lib/sanitize'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  birthDate: z.string().datetime().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  maritalStatus: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  streetNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
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
    const maskCpf = req.nextUrl.searchParams.get('mask') !== 'false'
    return NextResponse.json({ client: { ...safe, cpf: maskCpf ? '***.***.**-**' : (client as Record<string, unknown>).cpf } }, {
      headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=60' },
    })
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
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.name) data.name = sanitizeInput(parsed.data.name)
    if (parsed.data.birthDate) data.birthDate = new Date(parsed.data.birthDate)
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone ? sanitizePhone(parsed.data.phone) : null
    if (parsed.data.email !== undefined) data.email = parsed.data.email || null
    if (parsed.data.maritalStatus !== undefined) data.maritalStatus = parsed.data.maritalStatus || null
    if (parsed.data.profession !== undefined) data.profession = parsed.data.profession || null
    if (parsed.data.street !== undefined) data.street = parsed.data.street || null
    if (parsed.data.streetNumber !== undefined) data.streetNumber = parsed.data.streetNumber || null
    if (parsed.data.complement !== undefined) data.complement = parsed.data.complement || null
    if (parsed.data.neighborhood !== undefined) data.neighborhood = parsed.data.neighborhood || null
    if (parsed.data.city !== undefined) data.city = parsed.data.city || null
    if (parsed.data.state !== undefined) data.state = parsed.data.state || null
    if (parsed.data.zipCode !== undefined) data.zipCode = parsed.data.zipCode || null
    if (parsed.data.priority) data.priority = parsed.data.priority
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes ? sanitizeInput(parsed.data.notes) : null

    const client = await prisma.client.update({ where: { id: params.id }, data })

    await logAudit({
      userId: session.user.id,
      action: 'client.updated',
      resource: client.name,
      req,
      metadata: { clientId: client.id },
    })

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

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { name: true },
    })

    await prisma.client.delete({ where: { id: params.id } })

    await prisma.usageRecord.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: { totalClients: { decrement: 1 } },
    })

    if (client) {
      await logAudit({
        userId: session.user.id,
        action: 'client.deleted',
        resource: client.name,
        req,
        metadata: { clientId: params.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
