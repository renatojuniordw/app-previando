'use client'

import { useMediaQuery } from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { isValid } from 'date-fns'

interface DatePickerProps {
  value: Date | string | null
  onChange: (date: Date | null) => void
  label?: string
  error?: string
  hint?: string
  success?: boolean
  minDate?: Date | string
  maxDate?: Date | string
  disabled?: boolean
}

function toDate(v: Date | string | null): Date | null {
  if (!v) return null
  const d = typeof v === 'string' ? new Date(v) : v
  return isValid(d) ? d : null
}

function toMinMax(d: Date | string | undefined): Date | undefined {
  if (!d) return undefined
  const date = typeof d === 'string' ? new Date(d) : d
  return isValid(date) ? date : undefined
}

export function DatePicker({ value, onChange, label, error, hint, success, minDate, maxDate, disabled }: DatePickerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const normalized = toDate(value)

  const textFieldProps: Record<string, unknown> = {
    fullWidth: true,
    size: 'small',
    error: !!error,
  }

  const baseProps = {
    value: normalized,
    onChange: (newValue: Date | null) => onChange(newValue),
    format: 'dd/MM/yyyy',
    minDate: toMinMax(minDate),
    maxDate: toMinMax(maxDate),
    disabled,
    slotProps: { textField: textFieldProps },
    sx: {
      width: '100%',
      margin: '0 !important',
      '& .MuiOutlinedInput-root': {
        borderRadius: '0.375rem',
        height: '38px',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        border: `1px solid ${error ? '#ef4444' : success ? '#10b981' : '#cbd5e1'}`,
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
        fontSize: '0.875rem',
        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&:hover': {
          borderColor: error ? '#ef4444' : success ? '#10b981' : '#94a3b8',
        },
        '&.Mui-focused': {
          borderColor: error ? '#ef4444' : success ? '#10b981' : '#d97706',
          boxShadow: error 
            ? '0 0 0 2px rgba(239, 68, 68, 0.2)' 
            : success 
            ? '0 0 0 2px rgba(16, 185, 129, 0.2)' 
            : '0 0 0 2px rgba(217, 119, 6, 0.2)',
        },
      },
      '& .MuiOutlinedInput-input': {
        padding: '8px 12px',
        color: '#0f172a',
        boxSizing: 'border-box',
        height: '100%',
      },
      '& .MuiIconButton-root': {
        color: '#64748b',
        padding: '4px',
        marginRight: '2px',
      },
    },
  }

  const Picker = isMobile ? MobileDatePicker : DesktopDatePicker

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="neo-label">
          {label}
        </label>
      )}
      <Picker {...baseProps} />
      {error && (
        <p className="font-sans text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="font-sans text-xs text-slate-500 mt-1">
          {hint}
        </p>
      )}
    </div>
  )
}
