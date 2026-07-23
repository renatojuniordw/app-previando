import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { projectSimulations } from '@/lib/previdencia-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import { resolveBirthDateForCalculation } from '@/services/previdencia/helpers'
import { z } from 'zod'

const scenarioSchema = z.object({
  label: z.string().min(1, 'Rótulo do cenário é obrigatório.'),
  dib: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use YYYY-MM-DD.'),
  valorContribuicaoFutura: z.number().positive('O valor de contribuição futura deve ser positivo.'),
  modalidade: z.string().optional().default('APOSENTADORIA_IDADE'),
})

const requestSchema = z.object({
  scenarios: z.array(scenarioSchema)
    .min(2, 'Informe pelo menos 2 cenários para comparação.')
    .max(5, 'Máximo de 5 cenários por comparação.'),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    await verifyCaseOwnership(params.id, session.user.id)

    const parsed = requestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    // 1. Resolve CNIS e data de nascimento
    const { extracted, birthDate } = await resolveBirthDateForCalculation(
      params.id,
      parsed.data.scenarios[0].modalidade
    )

    // Busca gender do cliente
    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
      select: { client: { select: { gender: true } } },
    })
    const gender = (caseData?.client?.gender as 'M' | 'F') ?? 'F'

    // 2. Busca parâmetros legais vigentes
    const hojeStr = new Date().toISOString().slice(0, 10)
    const [salarioVigente, regrasVigentes] = await Promise.all([
      getSalarioVigente(hojeStr),
      getRegrasVigentes(hojeStr),
    ])

    // 3. Roda a projeção para cada cenário
    const results = parsed.data.scenarios.map((scenario) => {
      const result = projectSimulations({
        birthDate,
        gender,
        dibProjetada: scenario.dib,
        valorContribuicaoFutura: scenario.valorContribuicaoFutura,
        extractedData: extracted,
        modalidade: scenario.modalidade,
        salarioMinimo: salarioVigente.valor,
        tetoPrevidenciario: salarioVigente.teto,
        regrasVigentes,
      })

      const params = result.scenarioParams as Record<string, unknown>

      return {
        label: scenario.label,
        modalidade: scenario.modalidade || 'APOSENTADORIA_IDADE',
        dib: scenario.dib,
        rmi: result.rmiProjected,
        rma: result.rmaProjected,
        gainVsNow: result.gainVsNow,
        idade: params.idadeNaApuracaoAnos ?? 0,
        tempoContribuicaoAnos: params.tempoContribuicaoAnos ?? 0,
        elegivel: params.elegivel ?? false,
      }
    })

    return NextResponse.json({ scenarios: results })
  } catch (err) {
    return handleApiError(err)
  }
}
