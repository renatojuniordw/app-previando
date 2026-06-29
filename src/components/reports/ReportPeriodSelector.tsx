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
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
            value === opt.value
              ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
})
