import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { createUser } from '@/services/register'
import { getClientIp } from '@/lib/request-ip'

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

async function checkRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIp(req)

  const limit = await rateLimit(`register:${ip}`, 3, 3600)
  if (!limit.success) {
    return NextResponse.json({ error: 'Muitas tentativas de cadastro. Tente em 1 hora.' }, { status: 429 })
  }
  return null
}

async function parseBody(req: NextRequest): Promise<{ body: unknown; error?: NextResponse }> {
  try {
    return { body: await req.json() }
  } catch {
    return { body: null, error: NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }) }
  }
}

async function validateInput(body: unknown): Promise<{ data: z.infer<typeof schema>; error?: NextResponse }> {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      data: null as unknown as z.infer<typeof schema>,
      error: NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 }),
    }
  }
  return { data: parsed.data }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateError = await checkRateLimit(req)
  if (rateError) return rateError

  // Parse body
  const { body, error: parseError } = await parseBody(req)
  if (parseError) return parseError

  // Validate
  const { data: input, error: validationError } = await validateInput(body)
  if (validationError) return validationError

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })
  if (existing) {
    return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 })
  }

  // Create user (transactional)
  let user: Awaited<ReturnType<typeof createUser>>
  try {
    user = await createUser(input)
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 })
    }
    throw e
  }

  // Audit log (non-blocking)
  await logAudit({ userId: user.id, action: 'REGISTER', resource: 'user', req })

  return NextResponse.json({ user: { id: user.id, email: user.email, plan: user.plan } }, { status: 201 })
}