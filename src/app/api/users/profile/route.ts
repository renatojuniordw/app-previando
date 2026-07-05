import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/sanitize-server'
import { handleApiError } from '@/lib/api-error'

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional().nullable(),
  oabNumber: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  streetNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
})

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
    }

    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        if (key === 'name') {
          data[key] = sanitizeInput(value as string)
        } else {
          data[key] = (value as string) || null
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        oabNumber: true,
        cpf: true,
        maritalStatus: true,
        profession: true,
        street: true,
        streetNumber: true,
        complement: true,
        neighborhood: true,
        city: true,
        state: true,
        zipCode: true,
      },
    })

    return NextResponse.json({ user })
  } catch (err) {
    return handleApiError(err)
  }
}
