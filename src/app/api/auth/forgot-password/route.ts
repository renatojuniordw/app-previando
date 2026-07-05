import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { captureException } from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { Logger } from '@/lib/logger'
import { getClientIp } from '@/lib/request-ip'

const logger = new Logger('ForgotPassword')
const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

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

  // O upsert por { identifier, token } nunca "atualiza" nada, pois o token é
  // gerado agora e nunca existiu antes — isso fazia cada pedido de reset
  // acumular um token novo sem invalidar os anteriores. Apagamos os tokens
  // de reset anteriores deste email antes de criar o novo.
  await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } })
  await prisma.verificationToken.create({
    data: { identifier: `reset:${email}`, token, expires },
  })

  // Não vazamos a falha para o cliente (evita enumeração/diagnóstico externo),
  // mas registramos — sem isso, um SMTP fora do ar deixava o usuário sem
  // acesso e ninguém no time ficava sabendo.
  await sendPasswordResetEmail(email, token).catch((err) => {
    logger.error(`Falha ao enviar email de reset para usuário ${user.id}`, err)
    captureException(err)
  })

  return NextResponse.json({ ok: true })
}
