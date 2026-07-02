'use client'

import { useState, useCallback, useId, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { formatCurrencyDisplay, parseCurrency, stripNonDigits } from '@/lib/masks'

interface CurrencyInputProps {
  value: number | string
  onChange: (value: number) => void
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  wrapperClassName?: string
  min?: number
  max?: number
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, label, error, hint, placeholder, disabled, className, wrapperClassName, min: _min, max }, ref) => {
    const id = useId()
    const [focused, setFocused] = useState(false)

    const displayValue = useCallback(() => {
      if (value === 0 || value === '' || value === null || value === undefined) return ''
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num) || num <= 0) return ''
      return formatCurrencyDisplay(String(Math.round(num * 100)))
    }, [value])

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const digits = stripNonDigits(raw)
        const parsed = parseCurrency(formatCurrencyDisplay(digits || '0'))

        if (max !== undefined && parsed > max) return
        onChange(parsed)
      },
      [onChange, max]
    )

    const handleBlur = useCallback(() => {
      setFocused(false)
      // Ensure the displayed value is formatted on blur
      if (value && typeof value === 'number' && value > 0) {
        onChange(value)
      }
    }, [value, onChange])

    return (
      <div className={cn('space-y-1', wrapperClassName)}>
        {label && (
          <label htmlFor={id} className="neo-label">
            {label}
          </label>
        )}
        <div className="relative">
          <span
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm pointer-events-none z-10',
              error ? 'text-red-500' : disabled ? 'text-slate-300' : focused ? 'text-slate-700' : 'text-slate-400'
            )}
            aria-hidden="true"
          >
            R$
          </span>
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="numeric"
            value={displayValue()}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder || '0,00'}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(
              'neo-input w-full pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
          />
        </div>
        {error && (
          <p id={`${id}-error`} className="font-sans text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="font-sans text-sm text-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
