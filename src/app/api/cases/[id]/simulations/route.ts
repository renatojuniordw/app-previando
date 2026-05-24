import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'

const createSchema = z.object({
  scenarioName: z.string().min(1).max(100),
  scenarioParams: z.record(z.unknown()),
  rmiProjected: z.number(),
  rmaProjected: z.number(),
  dibProjected: z.string().datetime(),
  gainVsNow: z.number(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const simulations = await prisma.simulation.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ simulations })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'SIMULATOR')
    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })
    }

    const simulation = await prisma.simulation.create({
      data: {
        caseId: params.id,
        scenarioName: parsed.data.scenarioName,
        scenarioParams: parsed.data.scenarioParams as never,
        rmiProjected: parsed.data.rmiProjected,
        rmaProjected: parsed.data.rmaProjected,
        dibProjected: new Date(parsed.data.dibProjected),
        gainVsNow: parsed.data.gainVsNow,
      },
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
