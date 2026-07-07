import { describe, it, expect } from 'vitest'
import { computeEntryHash } from '@/lib/audit-hash'
import type { AuditJobData } from '@/lib/audit'

describe('computeEntryHash', () => {
  const sampleData: AuditJobData = {
    userId: 'user-1',
    action: 'CLIENT_CREATED',
    resource: 'client:abc123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    metadata: { test: true },
  }

  it('deve retornar hash hex de 64 caracteres', () => {
    const hash = computeEntryHash('genesis', sampleData, new Date('2024-01-01T00:00:00Z'))
    expect(hash.length).toBe(64)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  it('deve retornar mesmo hash para mesmos inputs', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    const h1 = computeEntryHash('genesis', sampleData, date)
    const h2 = computeEntryHash('genesis', sampleData, date)
    expect(h1).toBe(h2)
  })

  it('deve retornar hash diferente para previousHash diferente', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    const h1 = computeEntryHash('genesis', sampleData, date)
    const h2 = computeEntryHash('other-hash', sampleData, date)
    expect(h1).not.toBe(h2)
  })

  it('deve retornar hash diferente para action diferente', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    const h1 = computeEntryHash('genesis', sampleData, date)
    const h2 = computeEntryHash('genesis', { ...sampleData, action: 'CLIENT_DELETED' }, date)
    expect(h1).not.toBe(h2)
  })

  it('deve retornar hash diferente para data diferente', () => {
    const h1 = computeEntryHash('genesis', sampleData, new Date('2024-01-01T00:00:00Z'))
    const h2 = computeEntryHash('genesis', sampleData, new Date('2024-01-02T00:00:00Z'))
    expect(h1).not.toBe(h2)
  })

  it('deve tratar metadata nula como null', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    const h1 = computeEntryHash('genesis', { ...sampleData, metadata: undefined }, date)
    const h2 = computeEntryHash('genesis', { ...sampleData, metadata: null }, date)
    expect(h1).toBe(h2)
  })

  it('deve lidar com genesis como previousHash', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    const hash = computeEntryHash('genesis', sampleData, date)
    expect(hash.length).toBe(64)
  })
})
