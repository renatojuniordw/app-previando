import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { sanitizeForAI } from '@/lib/sanitize'
import { openai } from '@/lib/openai'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { AI_MODELS, AI_MAX_TOKENS } from '@/lib/ai-models'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardFeature(session.user.plan, 'DIAGNOSIS')
    await verifyCaseOwnership(params.id, session.user.id)

    // Rate limit: 10 diagnósticos/hora por usuário
    const limit = await rateLimit(`diagnosis:${session.user.id}`, 10, 3600)
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Limite de diagnósticos atingido. Tente em 1 hora.' },
        { status: 429 }
      )
    }

    const [caso, notes] = await prisma.$transaction([
      prisma.case.findUnique({
        where: { id: params.id },
        include: { client: { select: { name: true } } },
      }),
      prisma.caseNote.findMany({
        where: { caseId: params.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    if (notes.length === 0) {
      return NextResponse.json(
        { error: 'Prontuário vazio. Adicione anotações antes de gerar o diagnóstico.' },
        { status: 400 }
      )
    }

    const notesText = notes
      .map(
        (n: { type: string; createdAt: Date; content: string }) =>
          `[${n.type}] ${n.createdAt.toLocaleDateString('pt-BR')}: ${sanitizeForAI(n.content)}`
      )
      .join('\n\n')

    const response = await openai.chat.completions.create({
      model: AI_MODELS.CRITICAL,
      max_tokens: AI_MAX_TOKENS ?? 800,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de direito previdenciário.
Analise as anotações do prontuário e forneça um diagnóstico do caso.
Use apenas as informações fornecidas. Nunca invente dados.`,
        },
        {
          role: 'user',
          content: `CASO: ${caso?.benefitType} — ${caso?.status}
CLIENTE: ${sanitizeForAI(caso?.client?.name ?? 'N/A')}

PRONTUÁRIO (${notes.length} anotações):
${notesText}

Forneça:
1. Resumo da situação atual (2-3 frases)
2. Principais pendências identificadas
3. Próximas ações recomendadas
4. Alertas ou riscos identificados

Seja objetivo e técnico. Máximo 300 palavras.`,
        },
      ],
    })

    const diagnosis = response.choices[0]?.message?.content ?? ''

    return NextResponse.json({ diagnosis, notesAnalyzed: notes.length })
  } catch (err) {
    return handleApiError(err)
  }
}
