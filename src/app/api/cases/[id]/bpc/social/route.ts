import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { guardFeature, guardBpcAnalysisLimit } from '@/lib/plan-guard'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { gerarPerguntasSocial } from '@/services/bpc'
import { saveBpcToNotes, formatRelatoSocialText } from '@/lib/bpc-notes'
import { prisma } from '@/lib/prisma'
import { NoteType } from '@prisma/client'
import { z } from 'zod'
import type { RelatoSocial } from '@/types/bpc-social'

const SocialItemSchema = z.object({
  pergunta: z.string(),
  resposta: z.string(),
})

const SocialDominioSchema = z.object({
  id: z.string(),
  categoria: z.string(),
  titulo: z.string(),
  aspectosRelevantes: z.string(),
  lacunas: z.string(),
  itens: z.array(SocialItemSchema),
})

const RelatoSocialSchema = z.object({
  dominios: z.array(SocialDominioSchema),
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

    const analysis = await prisma.bpcAnalysis.findUnique({ where: { caseId: params.id } })
    if (!analysis) return NextResponse.json({ error: 'Dados do formulário BPC não encontrados.' }, { status: 400 })

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
      analiseLaudo: analysis.analiseLaudo ?? undefined,
    }

    const aiResult = await gerarPerguntasSocial(paramsData)

    // Converte perguntas[] -> itens[] com respostas vazias
    const relatoSocial: RelatoSocial = {
      dominios: (aiResult.dominios ?? []).map((d) => ({
        id: d.id,
        categoria: d.categoria,
        titulo: d.titulo,
        aspectosRelevantes: d.aspectosRelevantes,
        lacunas: d.lacunas,
        itens: (d.perguntas ?? []).map((pergunta) => ({ pergunta, resposta: '' })),
      })),
    }

    await prisma.bpcAnalysis.update({
      where: { id: analysis.id },
      data: { relatoSocial: relatoSocial as object },
    })

    return NextResponse.json({ relatoSocial })
  } catch (err: unknown) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const body = await req.json()
    const relatoSocial = RelatoSocialSchema.parse(body.relatoSocial)

    const analysis = await prisma.bpcAnalysis.findUnique({ where: { caseId: params.id } })
    if (!analysis) return NextResponse.json({ error: 'Dados do formulário BPC não encontrados.' }, { status: 400 })

    await prisma.bpcAnalysis.update({
      where: { id: analysis.id },
      data: { relatoSocial: relatoSocial as object },
    })

    await saveBpcToNotes(params.id, session.user.id, 'social', formatRelatoSocialText(relatoSocial))

    const bpcNotesCount = await prisma.caseNote.count({
      where: { caseId: params.id, type: NoteType.BPC_ANALYSIS },
    })

    return NextResponse.json({ ok: true, bpcNotesCount })
  } catch (err: unknown) {
    return handleApiError(err)
  }
}
