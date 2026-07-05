import { describe, it, expect, vi } from 'vitest'
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  PlanLimitError,
  extractApiError,
  handleApiError,
} from '@/lib/api-error'

describe('NotFoundError', () => {
  it('mensagem padrão', () => {
    const err = new NotFoundError()
    expect(err.message).toBe('Recurso não encontrado.')
    expect(err.name).toBe('NotFoundError')
  })

  it('mensagem customizada', () => {
    const err = new NotFoundError('Cliente não encontrado')
    expect(err.message).toBe('Cliente não encontrado')
  })
})

describe('ForbiddenError', () => {
  it('mensagem padrão', () => {
    const err = new ForbiddenError()
    expect(err.message).toBe('Acesso negado.')
    expect(err.name).toBe('ForbiddenError')
  })
})

describe('ValidationError', () => {
  it('mensagem padrão', () => {
    const err = new ValidationError()
    expect(err.message).toBe('Dados inválidos.')
    expect(err.name).toBe('ValidationError')
  })
})

describe('PlanLimitError', () => {
  it('tem feature e upgradeRequired', () => {
    const err = new PlanLimitError('Limite excedido', 'calculations', 'SOLO')
    expect(err.message).toBe('Limite excedido')
    expect(err.name).toBe('PlanLimitError')
    expect(err.feature).toBe('calculations')
    expect(err.upgradeRequired).toBe('SOLO')
  })
})

describe('extractApiError', () => {
  it('extrai erro da response axios', () => {
    const err = { response: { data: { error: 'Erro do servidor' } } }
    expect(extractApiError(err)).toBe('Erro do servidor')
  })

  it('retorna fallback quando não há response', () => {
    expect(extractApiError('erro simples')).toBe('Erro inesperado.')
  })

  it('retorna fallback customizado', () => {
    expect(extractApiError(null, 'Falha na operação')).toBe('Falha na operação')
  })

  it('retorna fallback quando response.data é undefined', () => {
    const err = { response: {} }
    expect(extractApiError(err)).toBe('Erro inesperado.')
  })
})

describe('handleApiError', () => {
  it('NotFoundError retorna 404', () => {
    const resp = handleApiError(new NotFoundError())
    expect(resp.status).toBe(404)
  })

  it('ForbiddenError retorna 403', () => {
    const resp = handleApiError(new ForbiddenError())
    expect(resp.status).toBe(403)
  })

  it('ValidationError retorna 400', () => {
    const resp = handleApiError(new ValidationError())
    expect(resp.status).toBe(400)
  })

  it('PlanLimitError retorna 402', () => {
    const resp = handleApiError(new PlanLimitError('Limite', 'calc', 'SOLO'))
    expect(resp.status).toBe(402)
  })

  it('erro genérico retorna 500', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const resp = handleApiError(new Error('algo deu errado'))
    expect(resp.status).toBe(500)
  })
})
