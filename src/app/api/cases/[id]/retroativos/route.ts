import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { verifyCaseOwnership, verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { PrevidenciaService } from '@/services/previdencia-service'

const createSchema = z.object({
  dataInicioDireito: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD).'),
  dataRequerimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD).'),
  valorMensalBruto: z.number().positive('O valor mensal deve ser maior que zero.'),
  valorDescontos: z.number().nonnegative('O desconto não pode ser negativo.').default(0),
  descricaoDescontos: z.string().optional(),
  percentualHonorarios: z.number().min(0, 'O percentual não pode ser negativo.').max(100, 'O percentual não pode ser maior que 100.').optional(),
}).strict()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const retroativos = await prisma.retroactive.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ retroativos })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // Validação de acesso à feature baseada no plano SaaS
    await guardFeature(session.user.plan, 'RETROATIVOS')

    const { success: limitOk } = await rateLimit(`retroativos:${session.user.id}`, 10, 3600)
    if (!limitOk) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })

    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Executa o cálculo e persistência seguros dos retroativos no servidor
    const retroativo = await PrevidenciaService.runAndSaveRetroativo({
      caseId: params.id,
      dataInicioDireito: parsed.data.dataInicioDireito,
      dataRequerimento: parsed.data.dataRequerimento,
      valorMensalBruto: parsed.data.valorMensalBruto,
      valorDescontos: parsed.data.valorDescontos,
      descricaoDescontos: parsed.data.descricaoDescontos,
      percentualHonorarios: parsed.data.percentualHonorarios,
    })

    // Registrar log de atividade
    await logAudit({
      userId: session.user.id,
      action: 'retroative.created',
      resource: `Retroativo calculado`,
      req,
      metadata: { caseId: params.id, retroactiveId: retroativo.id },
    })

    return NextResponse.json({ retroativo }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

