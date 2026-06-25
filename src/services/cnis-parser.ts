import { openai } from '../lib/openai'
import { sanitizeForAI } from '../lib/sanitize'
import { Logger } from '../lib/logger'
import { AI_MODELS, AI_MAX_TOKENS } from '../lib/ai-models'


const logger = new Logger('CNISParser')

// ─── Tipos ───────────────────────────────────────────────────────────────────

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

interface CnisSummary {
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
    resumoSalarios?: {
      media: number
      minimo: number
      maximo: number
      totalCompetencias: number
    }
  }>
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SUMMARY_SYSTEM_PROMPT = `Você é um especialista em análise de CNIS (Cadastro Nacional de Informações Sociais) do INSS.
Sua tarefa é analisar o texto do CNIS e extrair os dados estruturados de forma resumida.
Retorne APENAS um JSON válido, sem markdown, sem explicações.`

function buildSummaryUserPrompt(cnisText: string): string {
  return `Analise o texto do CNIS abaixo e extraia as informações resumidas de todos os períodos e empresas.

Informações a extrair:
1. NIT (número de inscrição do trabalhador)
2. Nome do segurado
3. Data de nascimento
4. Total de vínculos/contribuições
5. Data da primeira contribuição
6. Data da última contribuição
7. Lista de TODOS os períodos/vínculos com:
   - Nome do empregador
   - Data de início
   - Data de fim (null se vinculo ativo)
   - Resumo dos salários: média, mínimo, máximo, total de competências

NÃO inclua salários individuais por competência — apenas o resumo por período.

Retorne APENAS o JSON no seguinte formato:
{
  "nit": "...",
  "nome": "...",
  "dataNascimento": "YYYY-MM-DD",
  "totalContribuicoes": 0,
  "primeiraContribuicao": "YYYY-MM",
  "ultimaContribuicao": "YYYY-MM",
  "periodos": [
    {
      "empregador": "...",
      "inicio": "YYYY-MM",
      "fim": "YYYY-MM",
      "resumoSalarios": {
        "media": 0,
        "minimo": 0,
        "maximo": 0,
        "totalCompetencias": 0
      }
    }
  ]
}

Texto do CNIS:
${cnisText}`
}

const SALARIOS_SYSTEM_PROMPT = `Você é um especialista em extração de dados de CNIS do INSS.
Extraia TODOS os salários individuais do texto fornecido.
Retorne APENAS um JSON válido, sem markdown, sem explicações.`

function buildSalariosUserPrompt(periodoTexto: string): string {
  return `Extraia TODOS os salários mensais (competência e valor) do seguinte trecho do CNIS.
Não omita nenhuma competência. Se houver múltiplos empregadores neste trecho, inclua todos.

Retorne APENAS um array JSON no formato:
[
  { "competencia": "YYYY-MM", "valor": 0.00 },
  { "competencia": "YYYY-MM", "valor": 0.00 }
]

Texto do CNIS:
${periodoTexto}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ content: string; tokens: number; finishReason: string }> {
  const model = AI_MODELS.CRITICAL

  return openai.chat.completions.create(
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: maxTokens,
    },
    {
      httpAgent: undefined,
      timeout: 180_000,
    }
  ).then(response => {
    const finishReason = response.choices[0]?.finish_reason ?? 'unknown'
    const tokens = response.usage?.total_tokens ?? 0

    logger.info(`model=${model} tokens=${tokens} finish_reason=${finishReason}`)

    return {
      content: response.choices[0]?.message?.content ?? '{}',
      tokens,
      finishReason,
    }
  })
}

function parseJson<T>(raw: string): T | null {
  try {
    // Tentar parse direto
    return JSON.parse(raw) as T
  } catch {
    // Tentar extrair JSON de markdown ou texto com wrapper
    const jsonMatch = raw.match(/\{[\s\S]*\}/) || raw.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T
      } catch {
        return null
      }
    }
    return null
  }
}

// Divide o texto do CNIS em blocos por período/empregador
function splitCnisIntoBlocks(text: string): string[] {
  // Tenta identificar seções por empregador usando padrões comuns do CNIS
  const lines = text.split('\n')
  const blocks: string[] = []
  let currentBlock: string[] = []
  let inContribuicoes = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Detecta início da seção de contribuições/vínculos
    if (
      trimmed.includes('VINCULOS') ||
      trimmed.includes('EMPREGADOR') ||
      trimmed.includes('INFORMACOES DO SEGURADO') ||
      trimmed.includes('HISTORICO')
    ) {
      inContribuicoes = true
    }

    // Detecta novo empregador/período (padrões comuns)
    if (
      inContribuicoes &&
      (trimmed.match(/^\d{2}\/\d{4}/) || // Data no início da linha
       trimmed.includes('CNPJ') ||
       trimmed.includes('EMPRESA') ||
       trimmed.length > 3 && trimmed.match(/^[A-Z]/))
    ) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
      }
    }

    if (inContribuicoes) {
      currentBlock.push(line)
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'))
  }

  // Se não conseguiu dividir por empregador, divide em blocos de tamanho fixo
  if (blocks.length === 0) {
    const BLOCK_SIZE = 5000 // chars por bloco
    for (let i = 0; i < text.length; i += BLOCK_SIZE) {
      blocks.push(text.slice(i, i + BLOCK_SIZE))
    }
  }

  return blocks
}

// ─── Passagem 1: Resumo ─────────────────────────────────────────────────────

export async function parseCnisSummary(
  pdfText: string
): Promise<{ summary: CnisSummary; tokens: number }> {
  const textTruncated = sanitizeForAI(pdfText, 120000)

  logger.info(`Text before sanitize: ${pdfText.length}`)
  logger.info(`Text after sanitize: ${textTruncated.length}`)

  const { content, tokens, finishReason } = await callAI(
    SUMMARY_SYSTEM_PROMPT,
    buildSummaryUserPrompt(textTruncated),
    AI_MAX_TOKENS ?? 4000
  )

  if (finishReason === 'length') {
    logger.warn('Passagem 1 (resumo) foi truncada — max_tokens atingido')
  }

  const summary = parseJson<CnisSummary>(content)

  if (!summary) {
    throw new Error('Falha ao parsear JSON do resumo do CNIS')
  }

  return { summary, tokens }
}

// ─── Passagem 2: Salários em blocos ─────────────────────────────────────────

interface SalarioBloco {
  competencia: string
  valor: number
}


export async function parseCnisSalarios(
  pdfText: string
): Promise<{ salarios: Array<{ empregador?: string; salarios: SalarioBloco[] }>; totalTokens: number }> {
  const blocks = splitCnisIntoBlocks(pdfText)

  logger.info(`Dividindo CNIS em ${blocks.length} blocos para extração de salários`)

  // Processar blocos em paralelo (limitado para não sobrecarregar)
  const CONCURRENCY = 3
  const results: SalarioBloco[][] = []
  let totalTokens = 0

  for (let i = 0; i < blocks.length; i += CONCURRENCY) {
    const chunk = blocks.slice(i, i + CONCURRENCY)
    const promises = chunk.map(async (bloco) => {
      const { content, tokens } = await callAI(
        SALARIOS_SYSTEM_PROMPT,
        buildSalariosUserPrompt(sanitizeForAI(bloco, 15000)),
        AI_MAX_TOKENS ?? 4000
      )
      totalTokens += tokens
      return parseJson<SalarioBloco[]>(content) ?? []
    })

    const chunkResults = await Promise.all(promises)
    results.push(...chunkResults)
  }

  // Agrupar todos os salários
  const allSalarios = results.flat()

  logger.info(`Salários extraídos: ${allSalarios.length} competências em ${blocks.length} blocos`)

  return { salarios: [{ salarios: allSalarios }], totalTokens }
}

// ─── Função unificada (compatibilidade com código existente) ────────────────

export async function parseCnisWithAI(
  pdfText: string
): Promise<{ markdown: string; extractedData: CnisExtractedData }> {
  // Passagem 1: Resumo
  const { summary, tokens: summaryTokens } = await parseCnisSummary(pdfText)

  // Passagem 2: Salários (em background, não bloqueia)
  const { salarios, totalTokens: salariosTokens } = await parseCnisSalarios(pdfText)

  // Merge: adicionar salários aos períodos do resumo
  const allSalarios = salarios[0]?.salarios ?? []
  const periodos: CnisExtractedData['periodos'] = summary.periodos?.map(p => ({
    ...p,
    salarios: allSalarios, // Salários distribuídos entre todos os períodos
  })) ?? []

  // Construir extractedData compatível com o schema existente
  const extractedData: CnisExtractedData = {
    nit: summary.nit,
    nome: summary.nome,
    dataNascimento: summary.dataNascimento,
    totalContribuicoes: summary.totalContribuicoes,
    primeiraContribuicao: summary.primeiraContribuicao,
    ultimaContribuicao: summary.ultimaContribuicao,
    periodos,
  }

  // Gerar markdown simplificado
  const markdown = generateMarkdown(extractedData)

  const totalTokens = summaryTokens + salariosTokens
  logger.info(`CNIS completo: ${totalTokens} tokens (${summaryTokens} resumo + ${salariosTokens} salários)`)

  return { markdown, extractedData }
}

function generateMarkdown(data: CnisExtractedData): string {
  let md = `# CNIS - ${data.nome ?? 'Segurado'}\n\n`
  md += `- **NIT**: ${data.nit ?? 'N/A'}\n`
  md += `- **Nascimento**: ${data.dataNascimento ?? 'N/A'}\n`
  md += `- **Primeira contribuição**: ${data.primeiraContribuicao ?? 'N/A'}\n`
  md += `- **Última contribuição**: ${data.ultimaContribuicao ?? 'N/A'}\n\n`

  if (data.periodos?.length) {
    md += '## Períodos\n\n'
    for (const p of data.periodos) {
      const salarioCount = p.salarios?.length ?? 0
      md += `- **${p.empregador}**: ${p.inicio} → ${p.fim ?? 'Ativo'} (${salarioCount} competências)\n`
    }
  }

  return md
}
