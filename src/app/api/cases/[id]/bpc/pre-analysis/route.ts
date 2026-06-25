import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature, guardBpcAnalysisLimit } from '@/lib/plan-guard'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { gerarPreAnalise } from '@/services/bpc'
import { prisma } from '@/lib/prisma'
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'USE_BPC_MODULE')
    await guardBpcAnalysisLimit(session.user.id, session.user.plan)
    await verifyCaseOwnership(params.id, session.user.id)

    const { success } = await rateLimit(`bpc:${session.user.id}`, 15, 3600)
    if (!success) return NextResponse.json({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }, { status: 429 })

    const analysis = await prisma.bpcAnalysis.findUnique({ where: { caseId: params.id } })
    if (!analysis) return NextResponse.json({ error: 'Dados do formulário BPC não encontrados. Preencha o formulário primeiro.' }, { status: 400 })

    const paramsData = {
      patologia: analysis.patologia,
      cid: analysis.cid ?? undefined,
      idade: analysis.idade,
      faixaEtaria: analysis.faixaEtaria as 'MENOR_16' | 'MAIOR_16',
      rendaFamiliar: parseFloat(analysis.rendaFamiliar.toString()),
      membrosGrupo: analysis.membrosGrupo,
      rendaPerCapita: parseFloat(analysis.rendaPerCapita.toString()),
      barreirasRelatadas: analysis.barreiras ?? '',
      resumoLaudos: analysis.resumoLaudos ?? undefined,
    }

    const result = await gerarPreAnalise(paramsData)

    await prisma.bpcAnalysis.update({
      where: { id: analysis.id },
      data: { preAnalise: result },
    })

    // Registrar log de atividade
    await logAudit({
      userId: session.user.id,
      action: 'bpc.pre-analysis',
      resource: `Pré-análise BPC gerada`,
      req,
      metadata: { caseId: params.id },
    })

    return NextResponse.json({ result })
  } catch (err: unknown) {
    return handleApiError(err)
  }
}
