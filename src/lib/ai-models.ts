// Modelos OpenAI usados no Previando.
// CRITICAL: tarefas jurídicas e extração previdenciária (CNIS, pareceres, diagnóstico)
// OPERATIONAL: tarefas simples de texto (resumos, classificação)
export const AI_MODELS = {
  CRITICAL: 'gpt-4.1-mini',
  OPERATIONAL: 'gpt-4.1-nano',
} as const

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS]

// Custo médio estimado por token (blended input+output, ~2:1 ratio)
// gpt-4.1-mini:  $0.40/1M input, $1.60/1M output → ~$0.00000080/token
// gpt-4.1-nano:  $0.10/1M input, $0.40/1M output → ~$0.00000020/token
export const AI_COST_PER_TOKEN: Record<AiModel, number> = {
  'gpt-4.1-mini': 0.0000008,
  'gpt-4.1-nano': 0.0000002,
}
