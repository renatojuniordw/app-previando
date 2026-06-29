import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { guardFeature, guardProcessInterpretLimit, incrementProcessInterpretUsage } from '@/lib/plan-guard'
import { Logger } from '@/lib/logger'
import { openai } from '@/lib/openai'
import { sanitizeForAI } from '@/lib/sanitize'
import { AI_MODELS } from '@/lib/ai-models'
import type { InterpretOutput } from './types'

const logger = new Logger('InterpretProcess')

const SYSTEM_PROMPT = `Você é um especialista em direito previdenciário brasileiro. Sua função é analisar movimentações processuais e classificá-las por urgência para o advogado.

Analise a movimentação fornecida e retorne APENAS um objeto JSON válido com os seguintes campos:
- urgency: "CRITICAL" | "ACTION_REQUIRED" | "INFORMATIVE"
- urgencyLabel: string (rótulo curto em português, ex: "Prazo iminente", "Resposta necessária", "Informativo")
- interpretation: string (1-2 frases em português jurídico simplificado explicando o significado da movimentação)
- suggestedAction?: string (sugestão de ação, se aplicável, ex: "Verificar prazo para recurso", "Aguardar andamento")

Critérios de classificação:
- CRITICAL: prazos processuais correndo, decisões urgentes, risco de preclusão, citações/intimações pessoais
- ACTION_REQUIRED: movimentações que exigem atenção do advogado mas sem prazo iminente, como conclusão para sentença, vista para manifestação
- INFORMATIVE: movimentações rotineiras sem ação imediata necessária (juntada de petição, conclusos para despacho, etc.)

Retorne SOMENTE o JSON, sem markdown, sem formatação adicional.`

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    await guardFeature(session.user.plan, 'PROCESS_INTERPRET')
    await guardProcessInterpretLimit(session.user.id, session.user.plan)

    await verifyCaseOwnership(params.id, session.user.id)

    const { success } = await rateLimit(`interpret:${session.user.id}`, 15, 3600)
    if (!success) {
      return NextResponse.json(
        { error: 'Limite de requisições excedido. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      select: {
        processLastSummary: true,
        processLastMovDate: true,
        benefitType: true,
        client: { select: { name: true } },
      },
    })

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })
    }

    if (!caso.processLastSummary) {
      return NextResponse.json(
        { error: 'Nenhuma movimentação processual registrada para interpretar.' },
        { status: 400 }
      )
    }

    const movDate = caso.processLastMovDate
      ? new Date(caso.processLastMovDate).toLocaleDateString('pt-BR')
      : 'data desconhecida'

    const userPrompt = [
      'Dados do processo:',
      `- Cliente: ${sanitizeForAI(caso.client?.name ?? 'Cliente', 100)}`,
      `- Tipo de benefício: ${caso.benefitType.replace(/_/g, ' ')}`,
      `- Data da última movimentação: ${movDate}`,
      `- Descrição da última movimentação: "${sanitizeForAI(caso.processLastSummary, 1000)}"`,
      '',
      'Classifique a urgência desta movimentação para o advogado previdenciário responsável pelo caso.',
    ].join('\n')

    logger.info(`Interpretando movimentação: caseId=${params.id} summaryLen=${caso.processLastSummary.length}`)

    const response = await openai.chat.completions.create({
      model: AI_MODELS.OPERATIONAL,
      max_tokens: 300,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const content = response.choices[0]?.message?.content ?? ''

    if (!content) {
      logger.warn('Interpretação retornou conteúdo vazio', {
        finishReason: response.choices[0]?.finish_reason,
      })
      return NextResponse.json(
        { error: 'Não foi possível interpretar a movimentação. Tente novamente.' },
        { status: 500 }
      )
    }

    let result: InterpretOutput
    try {
      result = JSON.parse(content)
    } catch {
      logger.warn('Falha ao fazer parse da resposta da IA', { content })
      return NextResponse.json(
        { error: 'Resposta inválida da IA. Tente novamente.' },
        { status: 500 }
      )
    }

    // Validar campos obrigatórios
    if (!result.urgency || !result.urgencyLabel || !result.interpretation) {
      logger.warn('Resposta da IA com campos faltando', { result })
      return NextResponse.json(
        { error: 'Resposta inválida da IA. Tente novamente.' },
        { status: 500 }
      )
    }

    const tokensUsed = response.usage?.total_tokens ?? 0

    // Incrementa uso mensal após sucesso
    await incrementProcessInterpretUsage(session.user.id)

    logger.info(`Interpretação concluída: urgency=${result.urgency} tokens=${tokensUsed}`)

    return NextResponse.json({
      interpretation: result,
      meta: {
        model: AI_MODELS.OPERATIONAL,
        tokensUsed,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
