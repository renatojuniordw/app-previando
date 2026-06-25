export const BPC_CRITERIOS_LEGAIS = `
Critérios legais para concessão do BPC/LOAS:
1. Renda familiar per capita ≤ 1/4 do salário mínimo
2. Impedimento de longo prazo (mínimo 2 anos) que obstrua a participação plena na sociedade
3. Avaliação biopsicossocial baseada na Portaria Conjunta MDS/INSS nº 2/2015 e modelo CIF
`

export const BPC_PRE_ANALYSIS_SYSTEM_PROMPT = `Você é um especialista em direito previdenciário brasileiro com foco em BPC/LOAS.
Analisa casos com base na Portaria Conjunta MDS/INSS nº 2/2015 e no modelo
biopsicossocial da CIF. Seja técnico, objetivo e direto.
Nunca invente informações — use apenas o que foi fornecido.
Se dados insuficientes, aponte explicitamente o que falta.

${BPC_CRITERIOS_LEGAIS}`

export function buildPreAnalysisUserPrompt(params: {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: string
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  barreiras: string
  resumoLaudos?: string
}): string {
  const { patologia, cid, idade, faixaEtaria, rendaFamiliar, membrosGrupo, rendaPerCapita, barreiras, resumoLaudos } = params
  const faixaLabel = faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'

  return `Analise a viabilidade deste caso de BPC/LOAS:

Patologia: ${patologia} | CID: ${cid || 'N/A'}
Idade: ${idade} anos | Faixa: ${faixaLabel}
Renda familiar: R$ ${rendaFamiliar.toFixed(2)} | Membros: ${membrosGrupo}
Renda per capita: R$ ${rendaPerCapita.toFixed(2)}

Barreiras relatadas:
${barreiras}

Resumo dos laudos:
${resumoLaudos || 'Não informado'}

Avalie:
1. Se o caso preenche os critérios legais (renda + impedimento longo prazo)
2. Pontos positivos identificados
3. Pontos críticos ou frágeis
4. Sugestões para robustecer a prova social e médica
5. Lacunas documentais que precisam ser corrigidas
6. Feedback final: viável, frágil ou inviável — com justificativa técnica

Base: Portaria nº 2/2015, modelo biopsicossocial CIF.`
}
