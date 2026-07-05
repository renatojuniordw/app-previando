'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

export type PeriodOption = 30 | 90 | 180

interface ReportPeriodSelectorProps {
  value: PeriodOption
  onChange: (days: PeriodOption) => void
}

const OPTIONS: Array<{ label: string; value: PeriodOption }> = [
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
  { label: '180 dias', value: 180 },
]

export const ReportPeriodSelector = memo(function ReportPeriodSelector({
  value,
  onChange,
}: ReportPeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3.5 py-1.5 text-xs font-bold rounded-md transition-all duration-200',
            value === opt.value
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-555 hover:text-slate-800 hover:bg-slate-100/50'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
})
