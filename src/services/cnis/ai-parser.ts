import { openai } from '../../lib/openai'
import { sanitizeForAI } from '../../lib/sanitize'
import { Logger } from '../../lib/logger'
import { AI_MODELS, AI_MAX_TOKENS } from '../../lib/ai-models'
import { CnisExtractedData, generateMarkdown } from './types'

const logger = new Logger('CNISAiParser')

const SYSTEM_PROMPT = `Você é um especialista em Direito Previdenciário brasileiro e análise de CNIS (Cadastro Nacional de Informações Sociais) do INSS.

Seu único objetivo é extrair dados estruturados do texto de um CNIS e retornar um JSON válido.

Regras absolutas:
- Retorne APENAS o JSON. Sem markdown, sem explicações, sem comentários.
- Campos não encontrados ou ilegíveis devem ser retornados como null.
- Nunca omita uma chave do JSON — sempre inclua todas, mesmo que null.
- Nunca resuma, agrupe ou omita competências. Extraia 100% dos registros presentes.
- O texto pode conter ruído de OCR (espaços extras, quebras de linha no meio de valores, caracteres especiais). Normalize silenciosamente ao extrair.`

function buildUserPrompt(cnisText: string): string {
  return `Analise o texto do CNIS abaixo e extraia todas as informações conforme as regras e o schema definidos.

---

DEFINIÇÕES IMPORTANTES:

**Vínculo válido:** qualquer relação de emprego ou contribuição individual com salários registrados.
**Vínculo do tipo Benefício:** identificado pela palavra "Benefício" ou código de espécie de benefício (ex: B31, B32, B41, B42, B91, B92, B93, B94). Esses vínculos NÃO devem ser incluídos em \`periodos\`.
**totalContribuicoes:** contagem total de entradas no array \`salarios\` de todos os períodos válidos após aplicar todas as regras abaixo.

**Regra de competências duplicadas (IREM-ACD e similares):**
Quando a mesma competência aparece mais de uma vez dentro do mesmo vínculo (ex: "09/2018 3.841,35" e "09/2018 161,87 IREM-ACD"), some os valores e gere uma única entrada para aquela competência. Nunca crie dois objetos com a mesma \`competencia\` dentro do mesmo período.

**Regra de competências inválidas:**
Ignore e NÃO inclua em \`salarios\` competências que apresentem indicadores de remuneração pós-vínculo com bloqueio, como: PREM-FVIN, BLOQ-EC103, PREM-BLOQ-EC103, ou qualquer combinação desses. Esses registros representam pendências administrativas, não contribuições válidas.

**Regra de gaps:**
Dentro de cada período, identifique os meses ausentes entre a competência mais antiga e a mais recente do array \`salarios\`. Liste essas competências faltantes (formato "YYYY-MM") no campo \`gaps\`. Se não houver gaps, retorne array vazio [].

---

SCHEMA DE SAÍDA:

{
  "nit": string | null,            // formato: "000.00000.00-0"
  "nome": string | null,           // nome completo, sem abreviações
  "dataNascimento": string | null, // formato: "YYYY-MM-DD"
  "primeiraContribuicao": string | null, // formato: "YYYY-MM"
  "ultimaContribuicao": string | null,   // formato: "YYYY-MM"
  "totalContribuicoes": number | null,   // count de entradas em salarios de todos os períodos
  "periodos": [
    {
      "empregador": string | null,
      "inicio": string | null,     // formato: "YYYY-MM"
      "fim": string | null,        // formato: "YYYY-MM" — null se vínculo ainda ativo
      "salarios": [
        {
          "competencia": string,   // formato: "YYYY-MM"
          "valor": number          // valor numérico, ex: 1320.00
        }
      ],
      "gaps": [string]             // competências ausentes dentro do período, ex: ["2020-06"]
    }
  ]
}

---

EXEMPLO PARCIAL DE SAÍDA ESPERADA (para referência de formato):

{
  "nit": "123.45678.90-1",
  "nome": "MARIA DA SILVA SOUZA",
  "dataNascimento": "1975-03-22",
  "primeiraContribuicao": "1995-04",
  "ultimaContribuicao": "2023-11",
  "totalContribuicoes": 87,
  "periodos": [
    {
      "empregador": "EMPRESA EXEMPLO LTDA",
      "inicio": "1995-04",
      "fim": "1998-09",
      "salarios": [
        { "competencia": "1995-04", "valor": 450.00 },
        { "competencia": "1995-05", "valor": 450.00 }
      ],
      "gaps": ["1995-06"]
    }
  ]
}

---

ATENÇÃO FINAL:
- Se o texto estiver parcialmente ilegível, extraia o máximo possível e retorne null nos campos irrecuperáveis.
- Se periodos estiver vazio (nenhum vínculo válido encontrado), retorne array vazio [].
- totalContribuicoes deve refletir exatamente o count de competências extraídas, não estimativas.

Texto do CNIS:
${cnisText}`
}

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
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

interface ValidationResult {
  valid: boolean
  reason?: string
}

export async function validateCnisProgrammaticResult(
  pdfText: string,
  result: { nit: string | null; nome: string | null; primeiraContribuicao: string | null; ultimaContribuicao: string | null }
): Promise<ValidationResult> {
  // Usa início + fim do texto para cobrir cabeçalho (NIT/nome) e última competência
  const head = sanitizeForAI(pdfText.slice(0, 8000), 8000)
  const tail = sanitizeForAI(pdfText.slice(-3000), 3000)
  const excerpt = `${head}\n...\n${tail}`

  const prompt = `Você recebeu um trecho de um CNIS brasileiro. Verifique se os valores abaixo batem com o que está no texto.

VALORES A CONFIRMAR:
- NIT: ${result.nit ?? 'não encontrado'}
- Nome: ${result.nome ?? 'não encontrado'}
- Primeira contribuição (YYYY-MM): ${result.primeiraContribuicao ?? 'não encontrado'}
- Última contribuição (YYYY-MM): ${result.ultimaContribuicao ?? 'não encontrado'}

Responda APENAS com JSON neste formato (sem markdown):
{"valid": true} se todos os campos batem, ou
{"valid": false, "reason": "descrição do que diverge"} se algum campo diverge ou não for localizável no texto.

TRECHO DO CNIS:
${excerpt}`

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.OPERATIONAL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 100,
    })

    const content = response.choices[0]?.message?.content ?? ''
    const parsed = parseJson<ValidationResult>(content)
    if (!parsed || typeof parsed.valid !== 'boolean') {
      return { valid: false, reason: 'resposta de validação inválida' }
    }
    return parsed
  } catch (err) {
    return { valid: false, reason: `erro na validação: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function parseCnisWithAI(
  pdfText: string
): Promise<{ markdown: string; extractedData: CnisExtractedData; tokens: number }> {
  const text = sanitizeForAI(pdfText, 120000)
  const model = AI_MODELS.CRITICAL
  const systemPrompt = SYSTEM_PROMPT
  const userPrompt = buildUserPrompt(text)

  logger.info(`Text length: ${text.length} chars`)

  const response = await openai.chat.completions.create(
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: AI_MAX_TOKENS,
    },
    {
      httpAgent: undefined,
      timeout: 180_000,
    }
  )

  const finishReason = response.choices[0]?.finish_reason ?? 'unknown'
  const tokens = response.usage?.total_tokens ?? 0

  logger.info(`model=${model} tokens=${tokens} finish_reason=${finishReason}`)

  if (finishReason === 'length') {
    logger.warn('Resposta truncada — max_tokens atingido. Considere aumentar AI_MAX_TOKENS.')
  }

  const content = response.choices[0]?.message?.content ?? '{}'
  const extractedData = parseJson<CnisExtractedData>(content)

  if (!extractedData) {
    throw new Error('Falha ao parsear JSON do CNIS')
  }

  return { markdown: generateMarkdown(extractedData), extractedData, tokens }
}
