import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { gerarCarrossel } from '@/services/bpc'

const BENEFIT_LABELS: Record<string, string> = {
  APOSENTADORIA_IDADE: 'Aposentadoria por Idade',
  APOSENTADORIA_TEMPO_CONTRIBUICAO: 'Aposentadoria por Tempo de Contribuição',
  APOSENTADORIA_ESPECIAL: 'Aposentadoria Especial',
  APOSENTADORIA_HIBRIDA: 'Aposentadoria Híbrida',
  APOSENTADORIA_PONTOS: 'Aposentadoria por Pontos',
  AUXILIO_DOENCA: 'Auxílio-Doença',
  AUXILIO_ACIDENTE: 'Auxílio-Acidente',
  SALARIO_MATERNIDADE: 'Salário-Maternidade',
  AUXILIO_RECLUSAO: 'Auxílio-Reclusão',
  PENSAO_POR_MORTE: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
  REVISAO_BENEFICIO: 'Revisão de Benefício',
}

const schema = z.object({
  benefitType: z.enum([
    'APOSENTADORIA_IDADE',
    'APOSENTADORIA_TEMPO_CONTRIBUICAO',
    'APOSENTADORIA_ESPECIAL',
    'APOSENTADORIA_HIBRIDA',
    'APOSENTADORIA_PONTOS',
    'AUXILIO_DOENCA',
    'AUXILIO_ACIDENTE',
    'SALARIO_MATERNIDADE',
    'AUXILIO_RECLUSAO',
    'PENSAO_POR_MORTE',
    'BPC_LOAS',
    'REVISAO_BENEFICIO',
  ]),
  tema: z.string().min(5).max(300).optional(),
  contexto: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { success } = await rateLimit(`social-media:${session.user.id}`, 20, 3600)
    if (!success) return NextResponse.json({ error: 'Limite de requisições excedido.' }, { status: 429 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const { benefitType, tema, contexto } = parsed.data
    const label = BENEFIT_LABELS[benefitType]
    const temaFinal = tema ?? `Direitos relativos a ${label}`
    const contextoFinal = contexto ?? `Conteúdo educativo sobre ${label} no Brasil, focado em ajudar trabalhadores a entenderem seus direitos previdenciários.`

    const result = await gerarCarrossel(temaFinal, contextoFinal)

    return NextResponse.json({ result, benefitType, label })
  } catch (err) {
    return handleApiError(err)
  }
}
