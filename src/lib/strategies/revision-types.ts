/**
 * Tipos específicos para o módulo de Revisão de Benefícios
 */

export interface RevisionInput {
  tipoRevisao: RevisionType
  rmiConcedido: number
  dibConcedido: string // YYYY-MM-DD
  birthDate: string
  gender: 'M' | 'F'
  extractedData: import('@/services/cnis/types').CnisExtractedData | null
  salarioMinimo: number
  tetoPrevidenciario: number
}

export type RevisionType = 'REVISAO_VIDA_TODA' | 'REVISAO_ART_29' | 'REVISAO_BURACO_NEGRO'

export const REVISION_LABELS: Record<RevisionType, string> = {
  REVISAO_VIDA_TODA: 'Revisão da Vida Toda (Tema 1.102/STF)',
  REVISAO_ART_29: 'Revisão do Art. 29 (Tema 999/STJ)',
  REVISAO_BURACO_NEGRO: 'Revisão do Buraco Negro (EC 103/2019)',
}

export const REVISION_DESCRIPTIONS: Record<RevisionType, string> = {
  REVISAO_VIDA_TODA: 'Inclui contribuições anteriores a julho de 1994 no cálculo da média dos salários de contribuição, conforme decidido pelo STF no Tema 1.102.',
  REVISAO_ART_29: 'Revisão com base no Art. 29 da Lei 8.213/91 (Tema 999/STJ) — exclui os 20% menores salários de contribuição do período base.',
  REVISAO_BURACO_NEGRO: 'Revisão decorrente da EC 103/2019 — corrige distorções no cálculo do salário de benefício para segurados que tiveram o cálculo impactado pela Reforma.',
}

export interface RevisionResult {
  tipoRevisao: RevisionType
  rmiConcedido: number
  rmiRevisado: number
  diferencaMensal: number
  diferencaPercentual: number
  retroativos5Anos: number
  elegivel: boolean
  pendencias: string[]
  memoriaCalculo: {
    salarioBeneficioOriginal: number
    salarioBeneficioRevisado: number
    coeficienteAplicado: number
    contribuicoesConsideradasOriginal: number
    contribuicoesConsideradasRevisao: number
  }
}
