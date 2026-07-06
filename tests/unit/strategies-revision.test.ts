import { describe, it, expect } from 'vitest'
import { RevisaoBeneficioStrategy } from '@/lib/strategies/revision'

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

describe('RevisaoBeneficioStrategy', () => {
  it('modalidade correta', () => {
    expect(new RevisaoBeneficioStrategy().modalidade).toBe('REVISAO_BENEFICIO')
  })

  it('sempre elegível', () => {
    const result = new RevisaoBeneficioStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
    expect(result.pendencias).toHaveLength(0)
  })

  it('coeficiente progressivo com mais de 15 anos de contribuição', () => {
    const result = new RevisaoBeneficioStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBeGreaterThan(0.6)
  })

  it('coeficiente base 0.6 com menos de 15 anos', () => {
    const input = { ...baseInput, tempoContribuicaoAnos: 10 }
    const result = new RevisaoBeneficioStrategy().evaluate(input)
    expect(result.coeficiente).toBe(0.6)
  })
})
