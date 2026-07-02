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

export function DatePicker({ value, onChange, label, error, hint, minDate, maxDate, disabled }: DatePickerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const normalized = toDate(value)

  const textFieldProps: Record<string, unknown> = {
    fullWidth: true,
    error: !!error,
    helperText: error || hint || undefined,
  }

  const baseProps = {
    label,
    value: normalized,
    onChange: (newValue: Date | null) => onChange(newValue),
    format: 'dd/MM/yyyy',
    minDate: toMinMax(minDate),
    maxDate: toMinMax(maxDate),
    disabled,
    slotProps: { textField: textFieldProps },
    sx: { width: '100%' },
  }

  const Picker = isMobile ? MobileDatePicker : DesktopDatePicker
  return <Picker {...baseProps} />
}
