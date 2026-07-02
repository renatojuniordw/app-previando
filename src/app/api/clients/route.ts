import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashCPF, sanitizeInput, sanitizePhone } from '@/lib/sanitize'
import { guardClientLimit } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

const createSchema = z.object({
  name: z.string().min(2).max(100),
  cpf: z.string().min(11).max(14),
  birthDate: z.string().datetime(),
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
  priority: z.enum(['CRITICAL', 'ATTENTION', 'NORMAL']).default('NORMAL'),
  notes: z.string().max(2000).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search')?.trim()
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { userId: session.user.id }
    if (priority) where.priority = priority
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          name: true,
          birthDate: true,
          phone: true,
          email: true,
          priority: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          cases: {
            select: { id: true, status: true, benefitType: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.client.count({ where }),
    ])

    const safe = clients.map((c) => ({ ...c, cpf: '***.***.**-**' }))

    return NextResponse.json({ clients: safe, total, page, limit })
  } catch (err) {
    return handleApiError(err)
  }
}

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

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    await guardClientLimit(session.user.id, session.user.plan)

    const { name, cpf, birthDate, phone, email, maritalStatus, profession, street, streetNumber, complement, neighborhood, city, state, zipCode, priority, notes } = parsed.data

    const cpfHash = hashCPF(cpf)

    // Verifica duplicidade de CPF para o mesmo usuário
    const existing = await prisma.client.findFirst({
      where: { userId: session.user.id, cpfHash },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Cliente com este CPF já cadastrado.' }, { status: 409 })
    }

    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: sanitizeInput(name),
        cpfHash,
        birthDate: new Date(birthDate),
        phone: phone ? sanitizePhone(phone) : null,
        email: email || null,
        maritalStatus: maritalStatus || null,
        profession: profession || null,
        street: street || null,
        streetNumber: streetNumber || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        priority,
        notes: notes ? sanitizeInput(notes) : null,
      },
    })

    // Incrementa contador
    await prisma.usageRecord.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, totalClients: 1 },
      update: { totalClients: { increment: 1 } },
    })

    // Registrar log de atividade
    await logAudit({
      userId: session.user.id,
      action: 'client.created',
      resource: client.name,
      req,
      metadata: { clientId: client.id },
    })

    const safe = { ...client } as Record<string, unknown>
    delete safe.cpfHash
    return NextResponse.json({ client: { ...safe, cpf: '***.***.**-**' } }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
