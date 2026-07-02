import { openai } from '@/lib/openai'
import { sanitizeForAI } from '@/lib/sanitize'
import { AI_MODELS, AI_COST_PER_TOKEN, AI_MAX_TOKENS } from '@/lib/ai-models'
import { PETICAO_INICIAL_SYSTEM_PROMPT } from '@/lib/prompts/peticao-inicial'
import { Logger } from '@/lib/logger'

const logger = new Logger('PeticaoGenerator')

interface PeticaoInput {
  clientName: string
  clientCpf: string
  clientBirthDate: string
  clientMaritalStatus?: string | null
  clientProfession?: string | null
  clientCity?: string | null
  lawyerName: string
  lawyerOab: string | null
  lawyerMaritalStatus?: string | null
  lawyerProfession?: string | null
  lawyerCity?: string | null
  benefitType: string
  benefitTypeLabel: string
  cnisSummary?: string
  calculation?: {
    modalidade: string
    rmi: number | string
    rma: number | string
    salarioBeneficio: number | string
    elegivel: boolean
    tempoContribuicao: number
    idadeNaApuracao: number
  }
  retroativoTotal?: number | string
  caseNotes?: string
}

interface PeticaoOutput {
  content: string
  promptUsed: string
  tokensUsed: number
  costUsd: number
  model: string
}

export async function generatePeticao(input: PeticaoInput): Promise<PeticaoOutput> {
  logger.info('INPUT', {
    clientName: input.clientName,
    benefitType: input.benefitType,
    hasCalculation: Boolean(input.calculation),
    lawyerName: input.lawyerName,
  })

  const calcText = input.calculation
    ? `
CÁLCULO REALIZADO:
- Modalidade: ${input.calculation.modalidade}
- Salário de Benefício: R$ ${input.calculation.salarioBeneficio}
- RMI (Renda Mensal Inicial): R$ ${input.calculation.rmi}
- RMA (Renda Mensal Atual): R$ ${input.calculation.rma}
- Elegível: ${input.calculation.elegivel ? 'Sim' : 'Não'}
- Tempo de Contribuição: ${input.calculation.tempoContribuicao} meses
- Idade na Apuração: ${input.calculation.idadeNaApuracao} anos`
    : 'Nenhum cálculo selecionado'

  const retroativoText = input.retroativoTotal
    ? `\nVALORES RETROATIVOS: R$ ${input.retroativoTotal}`
    : ''

  const notesText = input.caseNotes
    ? `\nOBSERVAÇÕES DO CASO:\n${sanitizeForAI(input.caseNotes)}`
    : ''

  const cnisText = input.cnisSummary
    ? `\nRESUMO DO CNIS:\n${sanitizeForAI(input.cnisSummary, 5000)}`
    : ''

  const clientQual = [
    `Nome: ${sanitizeForAI(input.clientName)}`,
    input.clientMaritalStatus ? `Estado Civil: ${input.clientMaritalStatus}` : null,
    input.clientProfession ? `Profissão: ${input.clientProfession}` : null,
    `CPF: ${input.clientCpf}`,
    `Data de Nascimento: ${input.clientBirthDate}`,
    input.clientCity ? `Residente em: ${sanitizeForAI(input.clientCity)}` : null,
  ].filter(Boolean).join('\n')

  const lawyerQual = [
    `Nome: ${sanitizeForAI(input.lawyerName)}`,
    input.lawyerOab ? `OAB: ${input.lawyerOab}` : null,
  ].filter(Boolean).join('\n')

  const userPrompt = `Gere uma petição inicial completa com os dados abaixo:

QUALIFICAÇÃO DO SEGURADO:
${clientQual}

ADVOGADO:
${lawyerQual}

TIPO DE BENEFÍCIO: ${input.benefitTypeLabel} (${input.benefitType})
${calcText}
${retroativoText}
${cnisText}
${notesText}

Estrutura obrigatória:
1. ENDEREÇAMENTO - "Excelentíssimo(a) Juiz(íza) Federal da ___ Vara Federal de ___"
2. QUALIFICAÇÃO - Nome, nacionalidade, estado civil, profissão, portador do CPF ___, residente...
3. DOS FATOS - Histórico do segurado, contribuições, requerimento administrativo
4. DO DIREITO - Fundamentação com base nos cálculos e na lei
5. DOS PEDIDOS - Concessão do benefício, pagamento das parcelas vencidas, justiça gratuita
6. DAS PROVAS - Protesta por todos os meios de prova em direito admitidos
7. FECHAMENTO - Local, data, advogado, OAB

Requerimento final: "requer a concessão do benefício previdenciário"
Última linha: "Documento gerado pelo Previando (app.previando.com.br)"`

  const model = AI_MODELS.CRITICAL

  logger.info(`Chamando OpenAI model=${model} para petição`)

  const response = await openai.chat.completions.create({
    model,
    max_tokens: AI_MAX_TOKENS,
    temperature: 0.3,
    messages: [
      { role: 'system', content: PETICAO_INICIAL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  const content = response.choices[0]?.message?.content ?? ''

  const tokensUsed = response.usage?.total_tokens ?? 0
  const costUsd = tokensUsed * AI_COST_PER_TOKEN[model]

  logger.info(`Petição gerada tokens=${tokensUsed} cost=${costUsd}`)

  return {
    content,
    promptUsed: userPrompt,
    tokensUsed,
    costUsd,
    model,
  }
}
