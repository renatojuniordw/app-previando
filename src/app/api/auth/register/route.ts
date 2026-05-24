import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa ter ao menos uma maiúscula')
    .regex(/[0-9]/, 'Precisa ter ao menos um número'),
  oabNumber: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Rate limit: 3 registros/hora por IP
  const limit = await rateLimit(`register:${ip}`, 3, 3600)
  if (!limit.success) {
    return NextResponse.json({ error: 'Muitas tentativas de cadastro. Tente em 1 hora.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, password, oabNumber } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      oabNumber,
      plan: 'FREE',
      planStatus: 'ACTIVE',
      usageRecord: {
        create: {
          totalClients: 0,
          calculationsThisMonth: 0,
          opinionsThisMonth: 0,
        },
      },
    },
    select: { id: true, name: true, email: true, plan: true },
  })

  // Garante que PlanLimits existam (idempotente)
  const planLimitExists = await prisma.planLimit.findUnique({ where: { plan: 'FREE' } })
  if (!planLimitExists) {
    await prisma.planLimit.createMany({
      data: [
        {
          plan: 'FREE',
          maxClients: 3,
          maxCalculationsPerMonth: 5,
          maxOpinionsPerMonth: 1,
          maxNotesPerCase: 10,
          simulatorEnabled: false,
          retroativosEnabled: false,
          exportPdfEnabled: false,
          whatsappEnabled: false,
          watermarkEnabled: true,
          diagnosisEnabled: false,
        },
      ],
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ user }, { status: 201 })
}
