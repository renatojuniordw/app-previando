// CRITICAL: tarefas jurídicas e extração previdenciária (CNIS, pareceres, diagnóstico)
// OPERATIONAL: tarefas simples de texto (resumos, classificação)

const AI_MODELS_MAP = {
  CRITICAL: 'gpt-4.1-mini',
  OPERATIONAL: 'gpt-4.1-nano',
} as const

export const AI_MODELS = AI_MODELS_MAP

// gpt-4.1-mini: máximo suportado = 16384
export const AI_MAX_TOKENS: number = 16384

export type AiModel = (typeof AI_MODELS_MAP)[keyof typeof AI_MODELS_MAP]

// Custo médio estimado por token (blended input+output, ~2:1 ratio)
// gpt-4.1-mini:  $0.40/1M input, $1.60/1M output → ~$0.00000080/token
// gpt-4.1-nano:  $0.10/1M input, $0.40/1M output → ~$0.00000020/token
export const AI_COST_PER_TOKEN: Record<string, number> = {
  'gpt-4.1-mini': 0.0000008,
  'gpt-4.1-nano': 0.0000002,
}
