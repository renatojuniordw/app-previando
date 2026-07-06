export const STATUS_CONFIG: Record<string, { label: string; color: 'slate' | 'yellow' | 'lime' | 'red' | 'blue' }> = {
  PENDING: { label: 'Aguardando', color: 'slate' },
  PROCESSING: { label: 'Processando resumo...', color: 'yellow' },
  SUMMARY_READY: { label: 'Resumo pronto', color: 'blue' },
  PROCESSING_DETAILS: { label: 'Processando salários...', color: 'yellow' },
  COMPLETED: { label: 'Concluído', color: 'lime' },
  FAILED: { label: 'Falhou', color: 'red' },
}

export const PROCESSING_STATUSES = ['PENDING', 'PROCESSING', 'SUMMARY_READY', 'PROCESSING_DETAILS'] as const

export const isProcessingStatus = (status: string): boolean =>
  PROCESSING_STATUSES.includes(status as typeof PROCESSING_STATUSES[number])
