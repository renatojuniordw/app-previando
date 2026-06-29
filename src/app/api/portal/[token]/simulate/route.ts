import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculatePrevidenciario } from '@/lib/previdencia-engine'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import type { CnisExtractedData } from '@/services/cnis/types'

/**
 * POST /api/portal/[token]/simulate
 * Endpoint público (via token) para cliente simular "E se?" no portal.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const access = await prisma.clientAccess.findUnique({
      where: { token: params.token },
      include: {
        case: {
          include: {
            client: { select: { birthDate: true } },
            cnisDocument: { select: { extractedData: true, processingStatus: true } },
            user: { select: { plan: true } },
          },
        },
      },
    })

    if (!access) {
      return NextResponse.json({ error: 'Link inválido.' }, { status: 404 })
    }

    if (access.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Este link expirou.' }, { status: 410 })
    }

    // Rate limit por token: 5 simulações por hora
    const rl = await rateLimit(`portal-sim:${params.token}`, 5, 3600)
    if (!rl.success) {
      return NextResponse.json({ error: 'Limite de simulações atingido. Tente novamente em breve.' }, { status: 429 })
    }

    const c = access.case
    if (!c.client?.birthDate) {
      return NextResponse.json({ error: 'Dados do cliente incompletos.' }, { status: 422 })
    }
    if (c.cnisDocument?.processingStatus !== 'COMPLETED') {
      return NextResponse.json({ error: 'CNIS ainda não processado.' }, { status: 422 })
    }

    const { dibProjetada, valorContribuicao } = await req.json()
    if (!dibProjetada || !valorContribuicao) {
      return NextResponse.json({ error: 'Informe a data pretendida e o valor de contribuição.' }, { status: 400 })
    }

    const birthDate = c.client.birthDate.toISOString().split('T')[0]
    const salario = await getSalarioVigente(dibProjetada)
    const regras = await getRegrasVigentes(dibProjetada)
    const extractedData = c.cnisDocument!.extractedData as unknown as CnisExtractedData

    // Roda cálculo atual (hoje)
    const hojeStr = new Date().toISOString().split('T')[0]
    const calcHoje = calculatePrevidenciario({
      birthDate,
      gender: 'F',
      dib: hojeStr,
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData,
      salarioMinimo: salario.valor,
      tetoPrevidenciario: salario.teto,
      regrasVigentes: regras,
    })

    // Projeta contribuições futuras
    const clonedData: CnisExtractedData = JSON.parse(JSON.stringify(extractedData))
    if (!clonedData.periodos) clonedData.periodos = []

    const dataInicio = new Date()
    const dataFim = new Date(dibProjetada)
    const salariosProjetados: Array<{ competencia: string; valor: number }> = []

    const currentProj = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 1, 1)
    while (currentProj <= dataFim) {
      salariosProjetados.push({
        competencia: `${currentProj.getFullYear()}-${String(currentProj.getMonth() + 1).padStart(2, '0')}`,
        valor: Number(valorContribuicao),
      })
      currentProj.setMonth(currentProj.getMonth() + 1)
    }

    if (salariosProjetados.length > 0) {
      clonedData.periodos.push({
        empregador: 'PROJEÇÃO (SIMULADO PELO CLIENTE)',
        inicio: salariosProjetados[0].competencia + '-01',
        fim: salariosProjetados[salariosProjetados.length - 1].competencia + '-28',
        salarios: salariosProjetados,
      })
    }

    const calcProjetado = calculatePrevidenciario({
      birthDate,
      gender: 'F',
      dib: dibProjetada,
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: clonedData,
      salarioMinimo: salario.valor,
      tetoPrevidenciario: salario.teto,
      regrasVigentes: regras,
    })

    return NextResponse.json({
      atual: {
        rmi: calcHoje.rmi,
        elegivel: calcHoje.elegivel,
        idade: calcHoje.idadeNaApuracao,
        tempoContribuicao: calcHoje.tempoContribuicao,
      },
      projetado: {
        rmi: calcProjetado.rmi,
        elegivel: calcProjetado.elegivel,
        idade: calcProjetado.idadeNaApuracao,
        tempoContribuicao: calcProjetado.tempoContribuicao,
        dib: dibProjetada,
        mesesContribuicaoFutura: salariosProjetados.length,
        totalInvestido: salariosProjetados.length * Number(valorContribuicao),
      },
      ganho: Math.max(0, calcProjetado.rmi - calcHoje.rmi),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
