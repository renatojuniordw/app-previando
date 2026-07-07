import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyClientOwnership, verifyClientOwnershipAndActive } from '@/lib/ownership'
import { sanitizePhone } from '@/lib/sanitize'
import { sanitizeInput } from '@/lib/sanitize-server'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { deletePDF } from '@/services/r2'

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['M', 'F']).optional().nullable(),
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
        cnisDocument: { select: { processingStatus: true } },
        cases: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!client) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })

    // O CNIS pertence ao cliente (1 por segurado), mas cada caso ainda expõe
    // o mesmo documento em `cnisDocument` para não quebrar telas que já
    // exibem esse dado por caso.
    const clientWithCasesCnis = {
      ...client,
      cases: client.cases.map((c) => ({ ...c, cnisDocument: client.cnisDocument })),
    }

    const safe = { ...clientWithCasesCnis } as Record<string, unknown>
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

    await verifyClientOwnershipAndActive(params.id, session.user.id)

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
    if (parsed.data.gender !== undefined) data.gender = parsed.data.gender || null
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
      select: {
        name: true,
        birthDate: true,
        cnisDocument: { select: { r2Key: true } },
        cases: { select: { documents: { select: { r2Key: true } } } },
      },
    })

    if (!client) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })

    const anonymize = req.nextUrl.searchParams.get('anonymize') === 'true'

    if (anonymize) {
      // Anonimização (LGPD Art. 18, IV): remove PII mas preserva casos e
      // cálculos como registro de negócio. O CNIS é PII pura (extrato do
      // segurado) — precisa ser excluído por completo, banco + R2.
      if (client.cnisDocument) await deletePDF(client.cnisDocument.r2Key).catch(() => {})

      const anonymizedBirthDate = new Date(Date.UTC(client.birthDate.getUTCFullYear(), 0, 1))

      await prisma.$transaction([
        prisma.cnisDocument.deleteMany({ where: { clientId: params.id } }),
        prisma.client.update({
          where: { id: params.id },
          data: {
            name: 'Cliente Anonimizado',
            cpfHash: `anonymized:${randomBytes(16).toString('hex')}`,
            birthDate: anonymizedBirthDate,
            gender: null,
            phone: null,
            email: null,
            maritalStatus: null,
            profession: null,
            street: null,
            streetNumber: null,
            complement: null,
            neighborhood: null,
            city: null,
            state: null,
            zipCode: null,
            notes: null,
            active: false,
            anonymizedAt: new Date(),
          },
        }),
      ])

      await logAudit({
        userId: session.user.id,
        action: 'client.anonymized',
        resource: client.name,
        req,
        metadata: { clientId: params.id },
      })

      return NextResponse.json({ success: true })
    }

    const r2Keys = [
      ...(client.cnisDocument ? [client.cnisDocument.r2Key] : []),
      ...client.cases.flatMap((c) => c.documents.map((d) => d.r2Key)),
    ]

    await Promise.allSettled(r2Keys.map((key) => deletePDF(key)))

    await prisma.client.delete({ where: { id: params.id } })

    await prisma.usageRecord.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: { totalClients: { decrement: 1 } },
    })

    await logAudit({
      userId: session.user.id,
      action: 'client.deleted',
      resource: client.name,
      req,
      metadata: { clientId: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
