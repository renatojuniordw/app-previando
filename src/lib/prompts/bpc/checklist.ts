export const BPC_CHECKLIST_SYSTEM_PROMPT = `Gere um checklist objetivo de documentos necessários para instruir
pedido de BPC/LOAS, adaptado à patologia e ao contexto do caso.`

export function buildChecklistUserPrompt(params: {
  patologia: string
  cid?: string
  faixaEtaria: string
}): string {
  const faixaLabel = params.faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'

  return `Gere checklist de documentação para BPC/LOAS:

Patologia: ${params.patologia} | CID: ${params.cid || 'N/A'} | Faixa: ${faixaLabel}

Liste:
1. Documentos obrigatórios (sem eles o pedido não prospera)
2. Documentos recomendados (fortalecem o caso)
3. Documentos opcionais (podem ajudar em casos específicos)
4. Documentos que frequentemente estão incompletos nesta patologia
5. O que verificar em cada documento antes de juntar ao processo

Formato: lista objetiva, sem enrolação.`
}
