export const BPC_CHECKLIST_SYSTEM_PROMPT = `Gere um checklist objetivo de documentos necessários para instruir
pedido de BPC/LOAS, adaptado à patologia e ao contexto do caso.
Quando houver contexto de análises anteriores, use-o para personalizar
os documentos listados — priorize lacunas e pontos críticos já identificados.`

export function buildChecklistUserPrompt(params: {
  tipoBpc?: 'IDOSO' | 'DEFICIENCIA'
  patologia?: string
  cid?: string
  faixaEtaria: string
  relatoSocial?: string
  preAnalise?: string
  analiseLaudo?: string
  perguntasMedicas?: string
}): string {
  const tipoBpc = params.tipoBpc ?? 'DEFICIENCIA'
  const faixaLabel = params.faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'

  const preAnaliseSection = params.preAnalise?.trim()
    ? `\nPRÉ-ANÁLISE DO CASO (use as LACUNAS DOCUMENTAIS e RECOMENDAÇÕES para direcionar o checklist):\n${params.preAnalise}\n`
    : ''

  const laudoSection = params.analiseLaudo?.trim()
    ? `\nANÁLISE DO LAUDO MÉDICO (use os pontos negativos e complementações necessárias para incluir documentos específicos):\n${params.analiseLaudo}\n`
    : ''

  const relatoSection = params.relatoSocial?.trim()
    ? `\nRELATO DA ENTREVISTA SOCIAL (identifique documentos que comprovem as situações relatadas):\n${params.relatoSocial}\n`
    : ''

  const medicoSection = params.perguntasMedicas?.trim()
    ? `\nORIENTAÇÕES DA PERÍCIA MÉDICA (inclua documentos que fortaleçam os aspectos que o perito vai avaliar):\n${params.perguntasMedicas}\n`
    : ''

  if (tipoBpc === 'IDOSO') {
    return `Gere checklist de documentação para BPC/LOAS-idoso (sem exigência de laudo médico):

Faixa: ${faixaLabel}
${preAnaliseSection}${relatoSection}
Liste:
1. Documentos obrigatórios (comprovação de idade, renda e composição do grupo familiar)
2. Documentos recomendados (fortalecem a prova de miserabilidade)
3. Documentos opcionais (podem ajudar em casos específicos)
4. Documentos que frequentemente estão incompletos neste tipo de pedido
5. O que verificar em cada documento antes de juntar ao processo

Formato: lista objetiva, sem enrolação. Não inclua documentos médicos/laudos — esta modalidade não exige comprovação de deficiência.`
  }

  return `Gere checklist de documentação para BPC/LOAS:

Patologia: ${params.patologia ?? 'Não informado'} | CID: ${params.cid || 'N/A'} | Faixa: ${faixaLabel}
${preAnaliseSection}${laudoSection}${relatoSection}${medicoSection}
Liste:
1. Documentos obrigatórios (sem eles o pedido não prospera)
2. Documentos recomendados (fortalecem o caso)
3. Documentos opcionais (podem ajudar em casos específicos)
4. Documentos que frequentemente estão incompletos nesta patologia
5. O que verificar em cada documento antes de juntar ao processo

Formato: lista objetiva, sem enrolação. Priorize documentos específicos para este caso.`
}
