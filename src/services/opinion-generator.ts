import { openai } from '../lib/openai'
import { sanitizeForAI } from '../lib/sanitize'

interface OpinionInput {
  clientName: string
  benefitType: string
  caseStatus: string
  cnisSummary?: string
  calculations?: Array<{
    modalidade: string
    rmi: number | string
    rma: number | string
    elegivel: boolean
    pendencias: string[]
  }>
  notes?: Array<{ type: string; content: string; createdAt: Date }>
}

interface OpinionOutput {
  content: string
  promptUsed: string
  tokensUsed: number
  costUsd: number
  model: string
}

const SYSTEM_PROMPT = `Você é um assistente especializado em direito previdenciário brasileiro.
Estruture um parecer preliminar técnico com base nos dados fornecidos.

REGRAS ABSOLUTAS:
1. Use APENAS os dados fornecidos — nunca invente informações
2. Não faça afirmações categóricas sobre aprovação pelo INSS
3. Sempre inclua: "Este parecer é preliminar e não substitui análise jurídica completa"
4. Máximo 4 parágrafos — seja objetivo
5. Nunca citar leis sem certeza absoluta
6. Termine sempre com o rodapé: "Calculado via Previando (app.previando.com.br)"`

export async function generateOpinion(input: OpinionInput): Promise<OpinionOutput> {
  const calcsText =
    input.calculations
      ?.map(
        (c) =>
          `- ${c.modalidade}: RMI R$${c.rmi}, RMA R$${c.rma}, Elegível: ${c.elegivel ? 'Sim' : 'Não'}${
            c.pendencias.length > 0 ? `, Pendências: ${c.pendencias.join(', ')}` : ''
          }`
      )
      .join('\n') ?? 'Nenhum cálculo disponível'

  const notesText =
    input.notes
      ?.slice(0, 10)
      .map((n) => `[${n.type}] ${sanitizeForAI(n.content)}`)
      .join('\n') ?? 'Sem anotações'

  const userPrompt = `Gere um parecer preliminar previdenciário com os dados abaixo:

CLIENTE: ${sanitizeForAI(input.clientName)}
TIPO DE BENEFÍCIO: ${input.benefitType}
STATUS DO CASO: ${input.caseStatus}

RESUMO DO CNIS:
${input.cnisSummary ? sanitizeForAI(input.cnisSummary.slice(0, 2000)) : 'Não disponível'}

CÁLCULOS REALIZADOS:
${calcsText}

ANOTAÇÕES DO PRONTUÁRIO (últimas 10):
${notesText}

Estruture o parecer em:
1. Qualificação do segurado e tipo de benefício
2. Análise das modalidades calculadas e elegibilidade
3. Recomendação estratégica
4. Pendências e próximos passos

Sempre encerre com: "Este parecer é preliminar e não substitui análise jurídica completa"
Última linha: "Calculado via Previando (app.previando.com.br)"`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2000,
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  const content = response.choices[0]?.message?.content ?? ''
  const tokensUsed = response.usage?.total_tokens ?? 0
  // Custo GPT-4o mini: ~$0.30/1M tokens (média input+output)
  const costUsd = tokensUsed * 0.0000003

  return {
    content,
    promptUsed: userPrompt,
    tokensUsed,
    costUsd,
    model: 'gpt-4o-mini',
  }
}
