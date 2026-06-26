export const BPC_CRITERIOS_LEGAIS = `
Critérios legais para concessão do BPC/LOAS:
1. Renda familiar per capita ≤ 1/4 do salário mínimo vigente
2. Impedimento de longo prazo (mínimo 2 anos) que obstrua de forma significativa
   a participação plena e efetiva na sociedade em igualdade de condições
3. Avaliação biopsicossocial baseada na Portaria Conjunta MDS/INSS nº 2/2015
   e no modelo CIF (Classificação Internacional de Funcionalidade)
`

export const BPC_PRE_ANALYSIS_SYSTEM_PROMPT = `Você é um especialista sênior em direito previdenciário brasileiro com foco exclusivo em BPC/LOAS.

Sua função é analisar casos com base estrita na Portaria Conjunta MDS/INSS nº 2/2015 e no modelo biopsicossocial da CIF.

REGRAS INVIOLÁVEIS:
- Use apenas as informações fornecidas no caso. Nunca presuma, complete ou invente dados.
- Se dados forem insuficientes para uma avaliação segura, declare explicitamente quais estão faltando antes de qualquer análise.
- Sempre declare seu nível de confiança na avaliação final: ALTO (dados completos), MÉDIO (dados parciais) ou BAIXO (dados críticos ausentes).
- O veredicto final deve ser exatamente uma destas três palavras: VIÁVEL, FRÁGIL ou INVIÁVEL.

FORMATO DE RESPOSTA OBRIGATÓRIO (siga esta estrutura sem variações):
1. CRITÉRIO RENDA: [análise objetiva — atende / não atende / inconclusivo + justificativa]
2. CRITÉRIO IMPEDIMENTO: [análise objetiva — atende / não atende / inconclusivo + justificativa]
3. PONTOS POSITIVOS: [lista de elementos favoráveis identificados]
4. PONTOS CRÍTICOS: [lista de fragilidades ou riscos identificados]
5. LACUNAS DOCUMENTAIS: [documentos ausentes ou insuficientes que comprometem a prova]
6. RECOMENDAÇÕES: [ações concretas para robustecer a prova social e médica]
7. VEREDICTO: [VIÁVEL | FRÁGIL | INVIÁVEL] — Confiança: [ALTA | MÉDIA | BAIXA]
   Justificativa técnica: [fundamentação baseada na Portaria nº 2/2015 e CIF]

${BPC_CRITERIOS_LEGAIS}`

export function buildPreAnalysisUserPrompt(params: {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: 'MENOR_16' | 'MAIOR_16'
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  salarioMinimoVigente: number
  barreiras: string
  resumoLaudos?: string
  relatoSocial?: string
}): string {
  const {
    patologia, cid, idade, faixaEtaria,
    rendaFamiliar, membrosGrupo, rendaPerCapita,
    salarioMinimoVigente, barreiras, resumoLaudos, relatoSocial
  } = params

  const limiteRenda = salarioMinimoVigente / 4
  const rendaAtendeCriterio = rendaPerCapita <= limiteRenda

  const faixaLabel = faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — avaliar impacto em desenvolvimento, vida escolar, dependência de cuidadores e participação familiar'
    : 'Maior de 16 anos — avaliar impacto em capacidade laborativa, autonomia, vida comunitária e atividades da vida diária'

  const laudosSection = resumoLaudos?.trim()
    ? `Resumo dos laudos médicos/sociais:\n${resumoLaudos}`
    : `Resumo dos laudos médicos/sociais: NÃO FORNECIDO — considere esta ausência como lacuna documental crítica.`

  const relatoSection = relatoSocial?.trim()
    ? `\nRELATO DA ENTREVISTA SOCIAL (coletado pelo advogado):\n${relatoSocial}`
    : ''

  return `Analise a viabilidade deste caso para concessão do BPC/LOAS com base nos critérios legais vigentes.

---
DADOS DO CASO

Patologia: ${patologia}
CID: ${cid || 'Não informado'}
Idade: ${idade} anos
Perfil de análise: ${faixaLabel}

Renda familiar bruta: R$ ${rendaFamiliar.toFixed(2)}
Membros do grupo familiar: ${membrosGrupo}
Renda per capita: R$ ${rendaPerCapita.toFixed(2)}
Limite legal (1/4 SM vigente): R$ ${limiteRenda.toFixed(2)}
Critério de renda: ${rendaAtendeCriterio ? '✓ ATENDIDO' : '✗ NÃO ATENDIDO — atenção obrigatória'}

Barreiras relatadas pelo requerente:
${barreiras || 'Não informado — considere como lacuna crítica para avaliação do impedimento.'}

${laudosSection}
${relatoSection}
---
Produza sua análise seguindo rigorosamente o formato de resposta definido no seu papel.`
}
