import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { verifyCaseOwnership } from '@/lib/ownership'
import { calculatePrevidenciario } from '@/lib/previdencia-engine'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { rateLimit } from '@/lib/rate-limit'
import type { CnisExtractedData } from '@/services/cnis/types'

const ALL_MODALITIES = [
  'APOSENTADORIA_IDADE',
  'TEMPO_CONTRIBUICAO',
  'PONTOS_86_96',
  'PEDAGIO_50',
  'PEDAGIO_100',
  'APOSENTADORIA_ESPECIAL',
  'HIBRIDA',
  'IDADE_MINIMA_65_62',
  'AUXILIO_DOENCA_B31',
  'PENSAO_MORTE',
  'BPC_LOAS',
]

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // Rota computacionalmente pesada (22 cálculos) — limite de 10 req/min por usuário
    const rl = await rateLimit(`suggest:${session.user.id}`, 10, 60)
    if (!rl.success) return NextResponse.json({ error: 'Limite de requisições atingido. Tente novamente em breve.' }, { status: 429 })

    await verifyCaseOwnership(params.id, session.user.id)

    const fullCase = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { birthDate: true } },
        cnisDocument: { select: { extractedData: true, processingStatus: true } },
      },
    })

    if (!fullCase?.client?.birthDate) {
      return NextResponse.json({ error: 'Data de nascimento do cliente não informada.' }, { status: 422 })
    }

    if (fullCase.cnisDocument?.processingStatus !== 'COMPLETED') {
      return NextResponse.json({ error: 'CNIS ainda não processado.' }, { status: 422 })
    }

    const dib = new Date().toISOString().split('T')[0]
    const birthDate = fullCase.client.birthDate.toISOString().split('T')[0]

    // Inferir gênero pelo tipo de benefício ou usar padrão M
    // O campo gender não existe no Case; usa-se o calculador com M e F e retorna o melhor
    const [salario, regras] = await Promise.all([
      getSalarioVigente(dib),
      getRegrasVigentes(dib),
    ])

    const extractedData = fullCase.cnisDocument!.extractedData as CnisExtractedData

    const suggestions = ALL_MODALITIES.flatMap((modalidade) =>
      (['M', 'F'] as const).map((gender) => {
        const result = calculatePrevidenciario({
          birthDate,
          gender,
          dib,
          modalidade,
          extractedData,
          salarioMinimo: salario.valor,
          tetoPrevidenciario: salario.teto,
          regrasVigentes: regras,
        })
        return {
          modalidade,
          gender,
          elegivel: result.elegivel,
          rmi: result.rmi,
          coeficiente: result.coeficiente,
          tempoContribuicaoAnos: result.tempoContribuicao / 12,
          pendencias: result.pendencias,
        }
      })
    )

    const elegiveis = suggestions
      .filter((s) => s.elegivel)
      .sort((a, b) => b.rmi - a.rmi)

    const naoElegiveis = suggestions
      .filter((s) => !s.elegivel)
      .sort((a, b) => a.pendencias.length - b.pendencias.length)

    return NextResponse.json({ elegiveis, naoElegiveis })
  } catch (err) {
    return handleApiError(err)
  }
}
