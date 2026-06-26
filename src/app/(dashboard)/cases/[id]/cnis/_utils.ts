import { Periodo, PeriodWarning } from './_types'

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const formatCompetencia = (comp: string) => {
  if (!comp) return 'N/A'
  const parts = comp.split('-')
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`
  return comp
}

export const formatDateString = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`
  return dateStr
}

export const getPeriodWarnings = (periodo: Periodo, idx: number, allPeriodos: Periodo[]): PeriodWarning[] => {
  const warnings: PeriodWarning[] = []

  if (!periodo.fim) {
    warnings.push({ type: 'info', message: 'Vínculo sem data de encerramento registrada no CNIS (ativo).' })
  }

  if (!periodo.salarios || periodo.salarios.length === 0) {
    warnings.push({ type: 'warning', message: 'Sem salários de contribuição registrados neste período.' })
  }

  if (periodo.inicio) {
    const start = new Date(periodo.inicio)
    const end = periodo.fim ? new Date(periodo.fim) : new Date()

    allPeriodos.forEach((other, oIdx) => {
      if (idx === oIdx || !other.inicio) return
      const oStart = new Date(other.inicio)
      const oEnd = other.fim ? new Date(other.fim) : new Date()
      if (start <= oEnd && end >= oStart) {
        warnings.push({
          type: 'info',
          message: `Sobreposição de datas com o empregador "${other.empregador || 'Outro vínculo'}"`,
        })
      }
    })
  }

  return warnings
}

export const getStepStatus = (step: 1 | 2 | 3, currentStatus: string): 'completed' | 'active' | 'waiting' => {
  if (step === 1) return 'completed'
  if (step === 2) {
    if (currentStatus === 'PENDING') return 'waiting'
    if (currentStatus === 'PROCESSING') return 'active'
    if (['SUMMARY_READY', 'PROCESSING_DETAILS', 'COMPLETED'].includes(currentStatus)) return 'completed'
  }
  if (step === 3) {
    if (['PENDING', 'PROCESSING', 'SUMMARY_READY'].includes(currentStatus)) return 'waiting'
    if (currentStatus === 'PROCESSING_DETAILS') return 'active'
    if (currentStatus === 'COMPLETED') return 'completed'
  }
  return 'waiting'
}
