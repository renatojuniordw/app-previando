import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa ter ao menos uma maiúscula')
    .regex(/[0-9]/, 'Precisa ter ao menos um número'),
})

export async function POST(req: NextRequest) {
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
      data: { password: hashed },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    }),
  ])

  return NextResponse.json({ ok: true })
}
