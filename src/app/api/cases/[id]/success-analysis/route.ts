import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { openai } from '@/lib/openai'
import { AI_MODELS } from '@/lib/ai-models'
import { redis } from '@/lib/redis'
import { guardFeature } from '@/lib/plan-guard'

const BENEFIT_LABELS: Record<string, string> = {
  RETIREMENT_BY_AGE: 'Aposentadoria por Idade',
  RETIREMENT_BY_CONTRIBUTION_TIME: 'Aposentadoria por Tempo de Contribuição',
  SPECIAL_RETIREMENT: 'Aposentadoria Especial',
  HYBRID_RETIREMENT: 'Aposentadoria Híbrida',
  POINTS_RETIREMENT: 'Aposentadoria por Pontos',
  SICKNESS_BENEFIT: 'Auxílio-Doença',
  ACCIDENT_BENEFIT: 'Auxílio-Acidente',
  MATERNITY_PAY: 'Salário-Maternidade',
  PRISONER_BENEFIT: 'Auxílio-Reclusão',
  DEATH_PENSION: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
  BENEFIT_REVIEW: 'Revisão de Benefício',
}

const CACHE_TTL_SECONDS = 60 * 60 * 6 // 6 horas

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)
    await guardFeature(session.user.plan, 'DIAGNOSIS')

    const cacheKey = `success-analysis:${params.id}`
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(JSON.parse(cached))
    } catch { /* redis optional */ }

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            name: true,
            birthDate: true,
            cnisDocument: {
              select: {
                totalContributions: true,
                firstContribution: true,
                lastContribution: true,
                processingStatus: true,
              },
            },
          },
        },
        calculations: {
          orderBy: { rmi: 'desc' },
          take: 5,
          select: { modality: true, eligible: true, rmi: true, contributionTime: true, pendingIssues: true },
        },
        checklists: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { eligible: true, pendingIssues: true },
        },
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    const ageYears = caso.client.birthDate
      ? Math.floor((Date.now() - new Date(caso.client.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      : null

    const eligible = caso.calculations.filter((c) => c.eligible)
    const pending = caso.checklists[0]?.pendingIssues ?? []
    const calcPending = caso.calculations.flatMap((c) => c.pendingIssues)

    const contextStr = `
Tipo de benefício: ${BENEFIT_LABELS[caso.benefitType] ?? caso.benefitType}
Status do caso: ${caso.status}
Idade do cliente: ${ageYears != null ? `${ageYears} anos` : 'desconhecida'}
CNIS: ${caso.client.cnisDocument ? `processado (${caso.client.cnisDocument.totalContributions ?? 'N/A'} contribuições)` : 'não enviado'}
Modalidades elegíveis: ${eligible.length > 0 ? eligible.map((c) => c.modality).join(', ') : 'nenhuma identificada'}
Pendências do checklist: ${pending.length > 0 ? pending.join('; ') : 'nenhuma'}
Pendências dos cálculos: ${Array.from(new Set(calcPending)).slice(0, 5).join('; ') || 'nenhuma'}
`.trim()

    const prompt = `Você é um especialista em direito previdenciário brasileiro com 20 anos de experiência.

Com base nas informações abaixo sobre um caso previdenciário, forneça:
1. Um score de probabilidade de êxito de 0 a 100
2. Uma classificação: ALTA (>70), MÉDIA (40-70), BAIXA (<40) ou INCONCLUSIVO (dados insuficientes)
3. Até 3 pontos FAVORÁVEIS ao caso
4. Até 3 pontos DE ATENÇÃO ou RISCO
5. Uma recomendação prática em 2 linhas

DADOS DO CASO:
${contextStr}

Responda APENAS em JSON válido neste formato exato:
{
  "score": número de 0 a 100,
  "classification": "ALTA" | "MÉDIA" | "BAIXA" | "INCONCLUSIVO",
  "favorable": ["ponto 1", "ponto 2", "ponto 3"],
  "risks": ["risco 1", "risco 2", "risco 3"],
  "recommendation": "texto da recomendação"
}`

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.CRITICAL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw)

    const response = {
      score: Math.max(0, Math.min(100, Number(result.score) || 0)),
      classification: result.classification ?? 'INCONCLUSIVO',
      favorable: Array.isArray(result.favorable) ? result.favorable.slice(0, 3) : [],
      risks: Array.isArray(result.risks) ? result.risks.slice(0, 3) : [],
      recommendation: result.recommendation ?? '',
      generatedAt: new Date().toISOString(),
    }

    try {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response))
    } catch { /* redis optional */ }

    return NextResponse.json(response)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    try {
      await redis.del(`success-analysis:${params.id}`)
    } catch { /* redis optional */ }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
