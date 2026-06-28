import { openai } from '../lib/openai'
import { sanitizeForAI } from '../lib/sanitize'
import { AI_MODELS, AI_COST_PER_TOKEN, AI_MAX_TOKENS } from '../lib/ai-models'
import { Logger } from '../lib/logger'

const logger = new Logger('OpinionGenerator')

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
  logger.info('INPUT', {
    clientName: input.clientName,
    benefitType: input.benefitType,
    caseStatus: input.caseStatus,
    hasCnis: Boolean(input.cnisSummary),
    cnisLength: input.cnisSummary?.length ?? 0,
    calculationsCount: input.calculations?.length ?? 0,
    notesCount: input.notes?.length ?? 0,
  })

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
${input.cnisSummary ? sanitizeForAI(input.cnisSummary, 100000) : 'Não disponível'}

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

  const model = AI_MODELS.CRITICAL

  logger.info(`Chamando OpenAI model=${model} promptLength=${userPrompt.length}`)

  const response = await openai.chat.completions.create({
    model,
    max_tokens: AI_MAX_TOKENS,
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  logger.info('Resposta OpenAI', {
    finishReason: response.choices[0]?.finish_reason,
    contentLength: response.choices[0]?.message?.content?.length ?? 0,
    tokensUsed: response.usage?.total_tokens,
    promptTokens: response.usage?.prompt_tokens,
    completionTokens: response.usage?.completion_tokens,
  })

  const content = response.choices[0]?.message?.content ?? ''

  if (!content) {
    logger.warn(`AVISO: content vazio! finish_reason=${response.choices[0]?.finish_reason}`)
  }

  const tokensUsed = response.usage?.total_tokens ?? 0
  const costUsd = tokensUsed * AI_COST_PER_TOKEN[model]

  return {
    content,
    promptUsed: userPrompt,
    tokensUsed,
    costUsd,
    model,
  }
}
