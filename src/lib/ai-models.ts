// Modelos por provider — selecione via AI_PROVIDER no .env ("openai" | "verboo")
// CRITICAL: tarefas jurídicas e extração previdenciária (CNIS, pareceres, diagnóstico)
// OPERATIONAL: tarefas simples de texto (resumos, classificação)

const MODELS_OPENAI = {
  CRITICAL: 'gpt-4.1-mini',
  OPERATIONAL: 'gpt-4.1-nano',
} as const

const MODELS_VERBOO = {
  CRITICAL: 'qwen3.6-27b',
  OPERATIONAL: 'qwen3.6-27b',
} as const

const provider = process.env.AI_PROVIDER ?? 'openai'
const isVerboo = provider === 'verboo'

export const AI_MODELS = isVerboo ? MODELS_VERBOO : MODELS_OPENAI

console.log(`[AI] Provider: ${provider} | CRITICAL: ${AI_MODELS.CRITICAL} | OPERATIONAL: ${AI_MODELS.OPERATIONAL}`)

// Quando Verboo (ilimitado): usa 32768. Quando OpenAI: null → cada call site define seu próprio limite.
export const AI_MAX_TOKENS: number | null = isVerboo ? 32768 : null

export type AiModel = (typeof MODELS_OPENAI)[keyof typeof MODELS_OPENAI]
                    | (typeof MODELS_VERBOO)[keyof typeof MODELS_VERBOO]

// Custo médio estimado por token (blended input+output, ~2:1 ratio)
// gpt-4.1-mini:  $0.40/1M input, $1.60/1M output → ~$0.00000080/token
// gpt-4.1-nano:  $0.10/1M input, $0.40/1M output → ~$0.00000020/token
// Verboo (qwen3.6-27b): custo a verificar — usando 0 como placeholder
export const AI_COST_PER_TOKEN: Record<string, number> = {
  'gpt-4.1-mini': 0.0000008,
  'gpt-4.1-nano': 0.0000002,
  'qwen3.6-27b': 0,
}
