import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { guardFeature, guardBpcAnalysisLimit } from '@/lib/plan-guard'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'
import { analisarLaudo } from '@/services/bpc'
import { saveBpcToNotes } from '@/lib/bpc-notes'
import { prisma } from '@/lib/prisma'
import { NoteType } from '@prisma/client'
import { z } from 'zod'

const LaudoSchema = z.object({
  texto: z.string().min(10, 'O texto do laudo deve ter pelo menos 10 caracteres.').max(10000),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'USE_BPC_MODULE')
    await guardBpcAnalysisLimit(session.user.id, session.user.plan)
    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const { success } = await rateLimit(`bpc:${session.user.id}`, 15, 3600)
    if (!success) return NextResponse.json({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }, { status: 429 })

    const body = await req.json()
    const { texto } = LaudoSchema.parse(body)

    const analysis = await prisma.bpcAnalysis.findUnique({ where: { caseId: params.id } })
    if (!analysis) return NextResponse.json({ error: 'Dados do formulário BPC não encontrados.' }, { status: 400 })
    if (analysis.tipoBpc === 'IDOSO') {
      return NextResponse.json({ error: 'Análise de laudo médico não se aplica a BPC-idoso.' }, { status: 400 })
    }

    const paramsData = {
      tipoBpc: analysis.tipoBpc,
      patologia: analysis.patologia ?? undefined,
      cid: analysis.cid ?? undefined,
      idade: analysis.idade,
      faixaEtaria: analysis.faixaEtaria as 'MENOR_16' | 'MAIOR_16',
      rendaFamiliar: parseFloat(analysis.rendaFamiliar.toString()),
      membrosGrupo: analysis.membrosGrupo,
      rendaPerCapita: parseFloat(analysis.rendaPerCapita.toString()),
      barreirasRelatadas: analysis.barreiras ?? '',
      resumoLaudos: analysis.resumoLaudos ?? undefined,
      preAnalise: analysis.preAnalise ?? undefined,
    }

    const result = await analisarLaudo(texto, paramsData)

    await prisma.bpcAnalysis.update({
      where: { id: analysis.id },
      data: { analiseLaudo: result },
    })

    await saveBpcToNotes(params.id, session.user.id, 'laudo', result)

    const bpcNotesCount = await prisma.caseNote.count({
      where: { caseId: params.id, type: NoteType.BPC_ANALYSIS },
    })

    await logAudit({
      userId: session.user.id,
      action: 'bpc.laudo',
      resource: `Laudo BPC analisado`,
      req,
      metadata: { caseId: params.id },
    })

    return NextResponse.json({ result, bpcNotesCount })
  } catch (err: unknown) {
    return handleApiError(err)
  }
}
