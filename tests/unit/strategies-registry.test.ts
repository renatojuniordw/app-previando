import { describe, it, expect } from 'vitest'
import { getStrategy, getRegisteredModalities, registerStrategy } from '@/lib/strategies/registry'
import type { ModalidadeStrategy, ModalidadeEvaluationInput } from '@/lib/strategies/types'

describe('getRegisteredModalities', () => {
  it('retorna todas as modalidades registradas', () => {
    const modalities = getRegisteredModalities()
    expect(modalities.length).toBeGreaterThan(10)
    expect(modalities).toContain('APOSENTADORIA_IDADE')
    expect(modalities).toContain('AUXILIO_DOENCA_B31')
    expect(modalities).toContain('REVISAO_BENEFICIO')
  })
})

describe('getStrategy', () => {
  it('retorna estratégia para modalidade registrada', () => {
    const strategy = getStrategy('APOSENTADORIA_IDADE')
    expect(strategy.modalidade).toBe('APOSENTADORIA_IDADE')
  })

  it('retorna estratégia default para modalidade inexistente', () => {
    const strategy = getStrategy('MODALIDADE_INEXISTENTE')
    expect(strategy.modalidade).toBe('__default__')
  })

  it('estratégia default retorna não elegível', () => {
    const strategy = getStrategy('MODALIDADE_INEXISTENTE')
    const result = strategy.evaluate({
      idadeNaApuracao: 65,
      tempoContribuicaoAnos: 35,
      carenciaMeses: 200,
      salarioBeneficio: 3000,
      salarioMinimo: 1412,
      tetoPrevidenciario: 7500,
      gender: 'M',
      dependentesPensao: 0,
      tempoEspecialAnos: 0,
    })
    expect(result.elegivel).toBe(false)
    expect(result.pendencias[0]).toContain('não parametrizada')
  })

  it('todas as modalidades retornam estratégia válida', () => {
    for (const mod of getRegisteredModalities()) {
      const strategy = getStrategy(mod)
      expect(strategy.evaluate).toBeDefined()
      expect(strategy.modalidade).toBe(mod)
    }
  })
})

describe('registerStrategy', () => {
  it('registra nova estratégia', () => {
    const customStrategy = {
      modalidade: 'CUSTOM_TEST',
      evaluate: () => ({ elegivel: true, coeficiente: 1.0, pendencias: [] }),
    }
    registerStrategy(customStrategy)
    const strategy = getStrategy('CUSTOM_TEST')
    expect(strategy.modalidade).toBe('CUSTOM_TEST')
  })

  it('sobrescreve estratégia existente', () => {
    const overrideStrategy = {
      modalidade: 'APOSENTADORIA_IDADE',
      evaluate: () => ({ elegivel: true, coeficiente: 0.99, pendencias: [] }),
    }
    registerStrategy(overrideStrategy)
    const strategy = getStrategy('APOSENTADORIA_IDADE')
    expect(strategy.evaluate({
      idadeNaApuracao: 65,
      tempoContribuicaoAnos: 35,
      carenciaMeses: 200,
      salarioBeneficio: 3000,
      salarioMinimo: 1412,
      tetoPrevidenciario: 7500,
      gender: 'M',
      dependentesPensao: 0,
      tempoEspecialAnos: 0,
    }).coeficiente).toBe(0.99)
  })
})
