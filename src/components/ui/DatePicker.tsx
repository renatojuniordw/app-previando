'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date | string | null
  onChange: (date: Date | null) => void
  label?: string
  error?: string
  hint?: string
  minDate?: Date | string
  maxDate?: Date | string
  disabled?: boolean
  className?: string
  wrapperClassName?: string
}

export function DatePicker({ value, onChange, label, error, hint, minDate, maxDate, disabled, className, wrapperClassName }: DatePickerProps) {
  const id = useId()

  const toInputValue = (v: Date | string | null): string => {
    if (!v) return ''
    if (typeof v === 'string') return v.split('T')[0]
    return v.toISOString().split('T')[0]
  }

  const toDate = (v: string): Date | null => {
    if (!v) return null
    const [year, month, day] = v.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const toMinMax = (d: Date | string | undefined): string | undefined => {
    if (!d) return undefined
    return typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0]
  }

  return (
    <div className={cn('space-y-1', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="neo-label">{label}</label>
      )}
      <input
        id={id}
        type="date"
        value={toInputValue(value)}
        onChange={(e) => onChange(toDate(e.target.value))}
        min={toMinMax(minDate as Date | string | undefined)}
        max={toMinMax(maxDate as Date | string | undefined)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          'neo-input w-full',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
      />
      {error && <p id={`${id}-error`} className="font-sans text-sm text-red-500" role="alert">{error}</p>}
      {hint && !error && <p id={`${id}-hint`} className="font-sans text-sm text-slate-500">{hint}</p>}
    </div>
  )
}
