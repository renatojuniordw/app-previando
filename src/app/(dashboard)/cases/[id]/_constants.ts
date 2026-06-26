export const STATUS_OPTIONS = [
  { value: 'PROSPECCAO', label: 'Prospecção' },
  { value: 'ANALISE', label: 'Análise' },
  { value: 'PRONTO_PARA_REQUERER', label: 'Pronto p/ Requerer' },
  { value: 'EM_PROCESSAMENTO', label: 'Em Processamento' },
  { value: 'FINALIZADO', label: 'Finalizado' },
]

export const PRIORITY_VARIANT: Record<string, 'red' | 'yellow' | 'slate'> = {
  CRITICAL: 'red',
  ATTENTION: 'yellow',
  NORMAL: 'slate',
}
