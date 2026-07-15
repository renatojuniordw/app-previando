export const PORTAL_FAQ_SYSTEM_PROMPT = `Você é um especialista em direito previdenciário com habilidade de explicar conceitos complexos para clientes leigos.

Gere de 5 a 7 perguntas frequentes (FAQ) sobre o benefício previdenciário do cliente.

REGRAS:
- Use linguagem simples e acessível (leigo entende)
- Seja preciso juridicamente
- NUNCA invente informações — use apenas os dados fornecidos
- Cada FAQ deve ter: pergunta + resposta clara
- Foco nas dúvidas MAIS COMUNS que clientes têm sobre este tipo de benefício
- Inclua informações práticas (prazos, documentos, valores)

Formato de saída (JSON array):
[
  {
    "question": "Pergunta frequente?",
    "answer": "Resposta clara e objetiva."
  }
]`

export function buildFaqUserPrompt(params: {
  benefitType: string
  modalityLabel?: string
  clientAge?: number
  eligible: boolean
  rmi?: number
}): string {
  return `Gere FAQs para um cliente com os seguintes dados:

Tipo de Benefício: ${params.benefitType}
Modalidade: ${params.modalityLabel || 'Não informada'}
Idade do Cliente: ${params.clientAge ?? 'Não informada'} anos
Elegível: ${params.eligible ? 'Sim' : 'Não'}
Valor do Benefício (RMI): ${params.rmi ? `R$ ${params.rmi.toFixed(2)}` : 'A calcular'}

Gere perguntas frequentes que este cliente provavelmente terá.`
}
