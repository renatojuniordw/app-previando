import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatDate(date: Date | string): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  if (typeof date === 'string') {
    // Formato puro YYYY-MM-DD (data sem timezone)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      return formatter.format(new Date(year, month - 1, day))
    }

    // Formato ISO com T00:00:00 (data pura vinda do banco)
    if (/T00:00:00/.test(date)) {
      const [year, month, day] = date.split('T')[0].split('-').map(Number)
      return formatter.format(new Date(year, month - 1, day))
    }

    // ISO string com timezone — constrói a partir das partes locais
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return '—'
    return formatter.format(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()))
  }

  // É um objeto Date
  if (isNaN(date.getTime())) return '—'
  return formatter.format(date)
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1.split('T')[0]) : new Date(date1)
  const d2 = typeof date2 === 'string' ? new Date(date2.split('T')[0]) : new Date(date2)
  return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysUntil(date: Date | string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = typeof date === 'string' ? new Date(date.split('T')[0]) : new Date(date)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function addYears(date: Date | string, years: number): Date {
  const d = typeof date === 'string' ? new Date(date.split('T')[0]) : new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

export function isValidDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d instanceof Date && !isNaN(d.getTime())
}

export function formatDateTime(date: Date | string): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return formatter.format(d)
}
