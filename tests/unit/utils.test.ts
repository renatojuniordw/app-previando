import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '@/lib/utils'

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
    const date = new Date(2025, 5, 15) // Junho 15, 2025
    expect(formatDate(date)).toBe('15/06/2025')
  })

  it('deve retornar — para data inválida', () => {
    expect(formatDate('invalid-date')).toBe('—')
  })
})


