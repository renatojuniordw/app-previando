'use client'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface MonthPickerProps {
  value: string
  onChange: (v: string) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  const [year, month] = value ? value.split('-') : ['', '']

  const handleMonth = (m: string) => {
    if (m && year) onChange(`${year}-${m}`)
    else if (m) onChange(`${currentYear}-${m}`)
  }

  const handleYear = (y: string) => {
    if (y && month) onChange(`${y}-${month}`)
    else if (y && !month) onChange('')
  }

  return (
    <div className="flex gap-2">
      <select
        value={month || ''}
        onChange={(e) => handleMonth(e.target.value)}
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
      >
        <option value="">Mês</option>
        {MESES.map((m, i) => (
          <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
        ))}
      </select>
      <select
        value={year || ''}
        onChange={(e) => handleYear(e.target.value)}
        className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
      >
        <option value="">Ano</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  )
}
