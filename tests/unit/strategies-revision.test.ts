import { describe, it, expect } from 'vitest'
import {
  RevisaoVidaTodaStrategy,
  RevisaoArtigo29Strategy,
  RevisaoBuracoNegroStrategy,
} from '@/lib/strategies/revision'

const baseInput = {
  idadeNaApuracao: 65,
  tempoContribuicaoAnos: 35,
  carenciaMeses: 200,
  salarioBeneficio: 3000,
  salarioMinimo: 1412,
  tetoPrevidenciario: 7500,
  gender: 'M' as const,
  dependentesPensao: 0,
  tempoEspecialAnos: 0,
}

describe('RevisaoVidaTodaStrategy', () => {
  it('modalidade correta', () => {
    expect(new RevisaoVidaTodaStrategy().modalidade).toBe('REVISAO_VIDA_TODA')
  })

  it('sempre elegível', () => {
    const result = new RevisaoVidaTodaStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('coeficiente com 35 anos contrib', () => {
    const result = new RevisaoVidaTodaStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBeGreaterThan(0.6)
  })

  it('coeficiente base 0.6 com menos de 15 anos', () => {
    const input = { ...baseInput, tempoContribuicaoAnos: 10 }
    const result = new RevisaoVidaTodaStrategy().evaluate(input)
    expect(result.coeficiente).toBe(0.6)
  })
})

describe('RevisaoArtigo29Strategy', () => {
  it('modalidade correta', () => {
    expect(new RevisaoArtigo29Strategy().modalidade).toBe('REVISAO_ART_29')
  })

  it('elegível com carência suficiente', () => {
    const result = new RevisaoArtigo29Strategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível com carência insuficiente', () => {
    const input = { ...baseInput, carenciaMeses: 100 }
    const result = new RevisaoArtigo29Strategy().evaluate(input)
    expect(result.elegivel).toBe(false)
    expect(result.pendencias[0]).toContain('Carência mínima')
  })
})

describe('RevisaoBuracoNegroStrategy', () => {
  it('modalidade correta', () => {
    expect(new RevisaoBuracoNegroStrategy().modalidade).toBe('REVISAO_BURACO_NEGRO')
  })

  it('sempre elegível', () => {
    const result = new RevisaoBuracoNegroStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
    expect(result.pendencias).toHaveLength(0)
  })

  it('coeficiente progressivo', () => {
    const result = new RevisaoBuracoNegroStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBeGreaterThan(0.6)
  })
})
