import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa ter ao menos uma maiúscula')
    .regex(/[0-9]/, 'Precisa ter ao menos um número'),
})

/**
 * GET /api/auth/reset-password?token=xxx
 * Valida se o token é válido sem consumi-lo (apenas verificação).
 * Útil para feedback imediato na página de reset.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 1) {
    return NextResponse.json(
      { valid: false, reason: 'missing' },
      { status: 200 }
    )
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: { startsWith: 'reset:' },
    },
    select: { expires: true },
  })

  if (!record) {
    return NextResponse.json(
      { valid: false, reason: 'invalid' },
      { status: 200 }
    )
  }

  if (record.expires <= new Date()) {
    return NextResponse.json(
      { valid: false, reason: 'expired' },
      { status: 200 }
    )
  }

  return NextResponse.json({ valid: true }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const limit = await rateLimit(`reset-password:${ip}`, 10, 3600)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
      { status: 429 }
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? 'Dados inválidos.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { token, password } = parsed.data

  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: { startsWith: 'reset:' },
      expires: { gt: new Date() },
    },
  })

  if (!record) {
    return NextResponse.json(
      { error: 'Link inválido ou expirado. Solicite um novo.' },
      { status: 400 }
    )
  }

  const email = record.identifier.replace('reset:', '')
  const hashed = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      // passwordChangedAt invalida qualquer sessão JWT emitida antes deste
      // momento (ver src/lib/auth-server.ts e src/lib/admin-guard.ts)
      data: { password: hashed, passwordChangedAt: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    }),
    // Um novo pedido de reset não deveria reaproveitar um token de sessão antigo
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier, NOT: { token: record.token } },
    }),
  ])

  return NextResponse.json({ ok: true })
}
