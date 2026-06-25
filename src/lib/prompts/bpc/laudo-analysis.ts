export const BPC_LAUDO_SYSTEM_PROMPT = `Você é um especialista em análise de documentação médica para fins de BPC/LOAS.
Avalia laudos com base na Portaria nº 2/2015 e na CIF.
Seja direto. Aponte o que está bom e o que está ruim sem enrolação.`

export function buildLaudoAnalysisUserPrompt(params: {
  patologia: string
  faixaEtaria: string
  laudo: string
}): string {
  const { patologia, faixaEtaria, laudo } = params
  const faixaLabel = faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'

  return `Analise este laudo médico para fins de BPC/LOAS:

Patologia: ${patologia} | Faixa etária: ${faixaLabel}

LAUDO:
${laudo}

Avalie:
1. O laudo descreve impedimento de longo prazo? (mínimo 2 anos)
2. Há descrição funcional suficiente das limitações?
3. O conteúdo é compatível com os critérios da CIF?
4. A linguagem é compatível com a Portaria nº 2/2015?
5. Há coerência entre medicação prescrita e gravidade do quadro?
6. Menciona barreiras, necessidade de terceiros ou risco social?
7. Pontos positivos e negativos (objetivo e direto)
8. O laudo sustenta o pedido ou precisa de complementação?
9. Como seria o laudo ideal para este caso? (estrutura, conteúdos mínimos)

Classificação final: APTO | PARCIALMENTE APTO | INAPTO — com justificativa.`
}
