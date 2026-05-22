import { openai } from '../../lib/openai'
import { sanitizeForAI } from '../../lib/sanitize'
import type { DatajudResponse } from './index'

export async function summarizeProcesso(
  processo: DatajudResponse,
  clientName: string
): Promise<{ summary: string; tokensUsed: number; costUsd: number }> {
  const movimentacoesTexto = processo.movimentos
    .map((m) => {
      const data = new Date(m.dataHora).toLocaleDateString('pt-BR')
      const hora = new Date(m.dataHora).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const complemento = m.complemento ? ` — ${sanitizeForAI(m.complemento)}` : ''
      return `[${data} ${hora}] ${sanitizeForAI(m.nome)}${complemento}`
    })
    .join('\n')

  const userPrompt = `
Analise as movimentações processuais abaixo e gere um resumo claro para o cliente.

CLIENTE: ${sanitizeForAI(clientName)}
PROCESSO: ${processo.numeroProcesso}
DATA DE AJUIZAMENTO: ${new Date(processo.dataAjuizamento).toLocaleDateString('pt-BR')}
ÚLTIMA ATUALIZAÇÃO: ${new Date(processo.dataUltimaAtualizacao).toLocaleDateString('pt-BR')}
TOTAL DE MOVIMENTAÇÕES: ${processo.totalMovimentos}

ÚLTIMAS MOVIMENTAÇÕES:
${movimentacoesTexto}

Gere um resumo com:
1. Situação atual do processo (1-2 frases simples)
2. Última movimentação e o que significa para o cliente
3. Próximo passo esperado (se identificável)

REGRAS ABSOLUTAS:
- Use linguagem simples — o cliente não é advogado
- Nunca invente informações que não estão nas movimentações
- Máximo 150 palavras
- Sempre termine com: "Para mais informações, consulte seu advogado."
- Não use termos jurídicos sem explicação
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: `Você é um assistente que resume andamentos processuais em linguagem acessível para leigos.
Use sempre português claro e simples.
Nunca invente informações — use apenas o que está nas movimentações fornecidas.`,
      },
      { role: 'user', content: userPrompt },
    ],
  })

  const summary = response.choices[0]?.message?.content ?? ''
  const tokensUsed = response.usage?.total_tokens ?? 0
  // Custo GPT-4o mini: $0.15/1M input, $0.60/1M output (aprox.)
  const costUsd = tokensUsed * 0.0000003

  return { summary, tokensUsed, costUsd }
}
