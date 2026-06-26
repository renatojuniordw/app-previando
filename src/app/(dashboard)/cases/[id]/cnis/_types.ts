export interface CnisData {
  id: string
  processingStatus: string
  createdAt: string
  updatedAt: string
  extractedData: Record<string, unknown> | null
  processingError: string | null
  downloadUrl?: string | null
}

export interface Periodo {
  empregador: string
  inicio: string
  fim: string | null
  salarios: Array<{ competencia: string; valor: number }>
}

export interface CnisExtractedData {
  nit?: string
  nome?: string
  dataNascimento?: string
  totalContribuicoes?: number
  primeiraContribuicao?: string
  ultimaContribuicao?: string
  periodos?: Periodo[]
}

export interface PeriodWarning {
  type: 'info' | 'warning'
  message: string
}
