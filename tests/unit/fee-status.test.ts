import { describe, it, expect } from 'vitest'
import { computeFeeStatus, FEE_STATUSES, FEE_TYPES } from '@/lib/fee-status'

describe('FEE_STATUSES', () => {
  it('tem todos os status esperados', () => {
    expect(FEE_STATUSES).toEqual(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'])
  })
})

describe('FEE_TYPES', () => {
  it('tem todos os tipos esperados', () => {
    expect(FEE_TYPES).toEqual(['FIXED', 'CONTINGENCY', 'PERCENTAGE', 'OTHER'])
  })
})

describe('computeFeeStatus', () => {
  it('retorna CANCELLED quando cancelado', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 0,
      dueDate: new Date('2030-01-01'),
      cancelled: true,
    })).toBe('CANCELLED')
  })

  it('retorna PAID quando pago integralmente', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 1000,
      dueDate: new Date('2030-01-01'),
    })).toBe('PAID')
  })

  it('retorna PAID quando pago acima do total', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 1500,
      dueDate: new Date('2030-01-01'),
    })).toBe('PAID')
  })

  it('retorna PARTIAL quando pagamento parcial e não vencido', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 500,
      dueDate: new Date('2030-01-01'),
    })).toBe('PARTIAL')
  })

  it('retorna OVERDUE quando pagamento parcial e vencido', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 500,
      dueDate: new Date('2020-01-01'),
    })).toBe('OVERDUE')
  })

  it('retorna PENDING quando sem pagamento e não vencido', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 0,
      dueDate: new Date('2030-01-01'),
    })).toBe('PENDING')
  })

  it('retorna OVERDUE quando sem pagamento e vencido', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 0,
      dueDate: new Date('2020-01-01'),
    })).toBe('OVERDUE')
  })

  it('retorna PENDING quando dueDate é null', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 0,
      dueDate: null,
    })).toBe('PENDING')
  })

  it('retorna PARTIAL com dueDate null e pagamento parcial', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 300,
      dueDate: null,
    })).toBe('PARTIAL')
  })

  it('retorna PENDING quando totalAmount é 0 e sem pagamento', () => {
    expect(computeFeeStatus({
      totalAmount: 0,
      paidAmount: 0,
      dueDate: new Date('2030-01-01'),
    })).toBe('PENDING')
  })

  it('cancelled tem precedência sobre todas as condições', () => {
    expect(computeFeeStatus({
      totalAmount: 1000,
      paidAmount: 1000,
      dueDate: new Date('2020-01-01'),
      cancelled: true,
    })).toBe('CANCELLED')
  })
})
