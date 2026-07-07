import { describe, it, expect } from 'vitest'
import { STATUS_CONFIG, PROCESSING_STATUSES, isProcessingStatus } from '@/lib/cnis-status'

describe('STATUS_CONFIG', () => {
  it('deve ter configuracao para todos os status', () => {
    expect(STATUS_CONFIG.PENDING).toEqual({ label: 'Aguardando', color: 'slate' })
    expect(STATUS_CONFIG.PROCESSING).toEqual({ label: 'Processando resumo...', color: 'yellow' })
    expect(STATUS_CONFIG.SUMMARY_READY).toEqual({ label: 'Resumo pronto', color: 'blue' })
    expect(STATUS_CONFIG.PROCESSING_DETAILS).toEqual({ label: 'Processando salários...', color: 'yellow' })
    expect(STATUS_CONFIG.COMPLETED).toEqual({ label: 'Concluído', color: 'lime' })
    expect(STATUS_CONFIG.FAILED).toEqual({ label: 'Falhou', color: 'red' })
  })

  it('deve ter 6 status configurados', () => {
    expect(Object.keys(STATUS_CONFIG).length).toBe(6)
  })
})

describe('PROCESSING_STATUSES', () => {
  it('deve conter 4 status de processamento', () => {
    expect(PROCESSING_STATUSES.length).toBe(4)
  })

  it('deve incluir PENDING', () => {
    expect(PROCESSING_STATUSES).toContain('PENDING')
  })

  it('deve incluir PROCESSING', () => {
    expect(PROCESSING_STATUSES).toContain('PROCESSING')
  })

  it('nao deve incluir COMPLETED', () => {
    expect(PROCESSING_STATUSES).not.toContain('COMPLETED')
  })

  it('nao deve incluir FAILED', () => {
    expect(PROCESSING_STATUSES).not.toContain('FAILED')
  })
})

describe('isProcessingStatus', () => {
  it('deve retornar true para PENDING', () => {
    expect(isProcessingStatus('PENDING')).toBe(true)
  })

  it('deve retornar true para PROCESSING', () => {
    expect(isProcessingStatus('PROCESSING')).toBe(true)
  })

  it('deve retornar true para SUMMARY_READY', () => {
    expect(isProcessingStatus('SUMMARY_READY')).toBe(true)
  })

  it('deve retornar true para PROCESSING_DETAILS', () => {
    expect(isProcessingStatus('PROCESSING_DETAILS')).toBe(true)
  })

  it('deve retornar false para COMPLETED', () => {
    expect(isProcessingStatus('COMPLETED')).toBe(false)
  })

  it('deve retornar false para FAILED', () => {
    expect(isProcessingStatus('FAILED')).toBe(false)
  })

  it('deve retornar false para status inexistente', () => {
    expect(isProcessingStatus('UNKNOWN')).toBe(false)
  })
})
