import { openai } from '../lib/openai'
import { sanitizeForAI } from '../lib/sanitize'
import { Logger } from '../lib/logger'

const logger = new Logger('CNISParser')

interface CnisExtractedData {
  nit?: string
  nome?: string
  dataNascimento?: string
  totalContribuicoes?: number
  primeiraContribuicao?: string
  ultimaContribuicao?: string
  periodos?: Array<{
    empregador: string
    inicio: string
    fim: string | null
    salarios: Array<{ competencia: string; valor: number }>
  }>
}

export async function parseCnisWithAI(
  pdfText: string
): Promise<{ markdown: string; extractedData: CnisExtractedData }> {
  const textTruncated = sanitizeForAI(pdfText, 120000)

  logger.info(`Text before sanitize: ${pdfText.length}`)
  logger.info(`Text after sanitize: ${textTruncated.length}`)

  const systemPrompt = `Você é um especialista em análise de CNIS (Cadastro Nacional de Informações Sociais) do INSS.
Sua tarefa é analisar EXAUSTIVAMENTE e extrair TODOS os dados estruturados do texto do CNIS fornecido, sem omitir nenhuma página, empresa, empregador ou período de contribuição.
Retorne APENAS um JSON válido, sem markdown, sem explicações.`

  const userPrompt = `Analise todo o texto do CNIS de forma detalhada e extraia as informações de todos os períodos e empresas.
ATENÇÃO CRÍTICA: Não resuma nem omita nenhuma empresa ou período de contribuição. Se o CNIS possuir múltiplos empregadores ou páginas, percorra todo o texto e liste absolutamente TODOS eles no array "periodos", mesmo os mais antigos ou mais recentes.

Informações a extrair:
1. NIT (número de inscrição do trabalhador)
2. Nome do segurado
3. Data de nascimento
4. Total de vínculos/contribuições
5. Data da primeira contribuição
6. Data da última contribuição
7. Listagem de períodos com empregador, datas e salários

TEXTO DO CNIS:
${textTruncated}

Retorne JSON no formato:
{
  "nit": "string ou null",
  "nome": "string ou null",
  "dataNascimento": "YYYY-MM-DD ou null",
  "totalContribuicoes": number ou null,
  "primeiraContribuicao": "YYYY-MM ou null",
  "ultimaContribuicao": "YYYY-MM ou null",
  "periodos": [
    {
      "empregador": "string",
      "inicio": "YYYY-MM",
      "fim": "YYYY-MM ou null",
      "salarios": [{"competencia": "YYYY-MM", "valor": number}]
    }
  ]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 16000,
    temperature: 0, // Precisão máxima para extração
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }, {
    timeout: 180_000, // Margem de segurança de 3 minutos para esta chamada
  })

  logger.info('finish_reason', response.choices[0]?.finish_reason)

  const raw = response.choices[0]?.message?.content ?? '{}'
  let extractedData: CnisExtractedData = {}

  try {
    extractedData = JSON.parse(raw)
  } catch {
    extractedData = {}
  }

  // Gerar markdown legível para exibição
  const markdown = generateCnisMarkdown(extractedData)

  return { markdown, extractedData }
}

function generateCnisMarkdown(data: CnisExtractedData): string {
  const lines: string[] = [
    '# CNIS — Cadastro Nacional de Informações Sociais',
    '',
    '## Dados do Segurado',
    `- **NIT:** ${data.nit ?? 'N/A'}`,
    `- **Nome:** ${data.nome ?? 'N/A'}`,
    `- **Data de Nascimento:** ${data.dataNascimento ?? 'N/A'}`,
    `- **Total de Contribuições:** ${data.totalContribuicoes ?? 'N/A'}`,
    `- **Primeira Contribuição:** ${data.primeiraContribuicao ?? 'N/A'}`,
    `- **Última Contribuição:** ${data.ultimaContribuicao ?? 'N/A'}`,
    '',
    '## Períodos',
  ]

  for (const periodo of data.periodos ?? []) {
    lines.push(`\n### ${periodo.empregador}`)
    lines.push(`- **Período:** ${periodo.inicio} a ${periodo.fim ?? 'em andamento'}`)
    if (periodo.salarios?.length > 0) {
      lines.push(`- **Salários:** ${periodo.salarios.length} competências registradas`)
    }
  }

  return lines.join('\n')
}
