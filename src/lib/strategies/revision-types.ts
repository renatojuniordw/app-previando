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

// As teses de Vida Toda (Tema 1.102/STF), Art. 29 (Tema 999/STJ) e Buraco Negro (EC 103/2019)
// foram superadas/pacificadas pelo STF e removidas. Mantém-se apenas a revisão genérica.
export type RevisionType = 'REVISAO_BENEFICIO'

export const REVISION_LABELS: Record<RevisionType, string> = {
  REVISAO_BENEFICIO: 'Revisão de Benefício',
}

export const REVISION_DESCRIPTIONS: Record<RevisionType, string> = {
  REVISAO_BENEFICIO: 'Recalcula o benefício concedido com base nos dados atuais do CNIS, comparando o valor original com o valor recalculado.',
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
