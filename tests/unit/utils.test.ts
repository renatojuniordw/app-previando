import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate, formatPercentage, daysUntil } from '@/lib/utils'

describe('cn', () => {
  it('merge classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('condicional', () => {
    expect(cn('base', true && 'active', false && 'disabled')).toBe('base active')
  })
})

describe('formatCurrency', () => {
  it('deve formatar valor em reais', () => {
    expect(formatCurrency(1500.50)).toContain('1.500,50')
  })

  it('deve aceitar string', () => {
    expect(formatCurrency('2500.00')).toContain('2.500,00')
  })

  it('deve formatar zero', () => {
    expect(formatCurrency(0)).toContain('0,00')
  })
})

describe('formatDate', () => {
  it('deve formatar data YYYY-MM-DD', () => {
    expect(formatDate('2025-06-15')).toBe('15/06/2025')
  })

  it('deve formatar data ISO com T00:00:00', () => {
    expect(formatDate('2025-06-15T00:00:00')).toBe('15/06/2025')
  })

  it('deve formatar objeto Date', () => {
    const date = new Date(2025, 5, 15)
    expect(formatDate(date)).toBe('15/06/2025')
  })

  it('deve retornar — para data inválida', () => {
    expect(formatDate('invalid-date')).toBe('—')
  })

  it('deve formatar ISO com timezone', () => {
    expect(formatDate('2025-06-15T12:00:00Z')).toBeDefined()
  })

  it('deve retornar — para Date inválido', () => {
    expect(formatDate(new Date('invalid'))).toBe('—')
  })
})

describe('formatPercentage', () => {
  it('formata com 1 decimal', () => {
    expect(formatPercentage(75.123)).toBe('75.1%')
  })

  it('formata com 2 decimais', () => {
    expect(formatPercentage(75.123, 2)).toBe('75.12%')
  })

  it('formata zero', () => {
    expect(formatPercentage(0)).toBe('0.0%')
  })

  it('formata 100', () => {
    expect(formatPercentage(100)).toBe('100.0%')
  })
})

describe('daysUntil', () => {
  it('calcula dias futuros', () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    const days = daysUntil(future)
    expect(days).toBeGreaterThanOrEqual(9)
    expect(days).toBeLessThanOrEqual(11)
  })

  it('calcula dias passados como negativo', () => {
    const past = new Date()
    past.setDate(past.getDate() - 5)
    const days = daysUntil(past)
    expect(days).toBeLessThan(0)
  })

  it('aceita string YYYY-MM-DD', () => {
    const days = daysUntil('2099-12-31')
    expect(days).toBeGreaterThan(0)
  })
})
