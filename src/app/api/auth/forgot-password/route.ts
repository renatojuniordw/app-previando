import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'

  const limit = await rateLimit(`forgot-password:${ip}`, 5, 3600)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
      { status: 429 }
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
  }

  const { email } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  })

  // Responde com sucesso mesmo se o email não existir (evita enumeração de usuários)
  if (!user?.password) {
    return NextResponse.json({ ok: true })
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600 * 1000) // 1 hora

  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: `reset:${email}`, token: token } },
    update: { token, expires },
    create: { identifier: `reset:${email}`, token, expires },
  })

  await sendPasswordResetEmail(email, token).catch(() => {
    // Log silencioso — não vaza a falha para o cliente
  })

  return NextResponse.json({ ok: true })
}
