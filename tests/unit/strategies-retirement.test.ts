import { describe, it, expect } from 'vitest'
import {
  AposentadoriaIdadeStrategy,
  IdadeMinimaProgressivaStrategy,
  TempoContribuicaoStrategy,
  PontosStrategy,
  Pedagio50Strategy,
  Pedagio100Strategy,
  AposentadoriaEspecialStrategy,
  AposentadoriaPCDStrategy,
  HibridaStrategy,
} from '@/lib/strategies/retirement'

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

describe('AposentadoriaIdadeStrategy', () => {
  it('modalidade correta', () => {
    expect(new AposentadoriaIdadeStrategy().modalidade).toBe('APOSENTADORIA_IDADE')
  })

  it('elegível homem 65 anos, 35 anos contrib', () => {
    const result = new AposentadoriaIdadeStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
    expect(result.pendencias).toHaveLength(0)
  })

  it('não elegível — idade insuficiente', () => {
    const input = { ...baseInput, idadeNaApuracao: 50 }
    const result = new AposentadoriaIdadeStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
    expect(result.pendencias[0]).toContain('Idade mínima')
  })

  it('não elegível — tempo contribuição insuficiente', () => {
    const input = { ...baseInput, tempoContribuicaoAnos: 10 }
    const result = new AposentadoriaIdadeStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })

  it('não elegível — carência insuficiente', () => {
    const input = { ...baseInput, carenciaMeses: 100 }
    const result = new AposentadoriaIdadeStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })

  it('elegível mulher 62 anos', () => {
    const input = { ...baseInput, gender: 'F' as const, idadeNaApuracao: 62 }
    const result = new AposentadoriaIdadeStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })

  it('coeficiente progressivo', () => {
    const result = new AposentadoriaIdadeStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBeGreaterThan(0.6)
  })

  it('usa regra customizada', () => {
    const input = {
      ...baseInput,
      regra: { idadeMinima: 60, tempoContribuicaoAnos: 20, carenciaMeses: 100 },
    }
    const result = new AposentadoriaIdadeStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })
})

describe('IdadeMinimaProgressivaStrategy', () => {
  it('modalidade correta', () => {
    expect(new IdadeMinimaProgressivaStrategy().modalidade).toBe('IDADE_MINIMA_65_62')
  })

  it('elegível com idade e tempo mínimos', () => {
    const result = new IdadeMinimaProgressivaStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível com idade abaixo', () => {
    const input = { ...baseInput, idadeNaApuracao: 60 }
    const result = new IdadeMinimaProgressivaStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })
})

describe('TempoContribuicaoStrategy', () => {
  it('modalidade correta', () => {
    expect(new TempoContribuicaoStrategy().modalidade).toBe('TEMPO_CONTRIBUICAO')
  })

  it('elegível homem 35 anos contrib', () => {
    const result = new TempoContribuicaoStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível homem com 25 anos contrib', () => {
    const input = { ...baseInput, tempoContribuicaoAnos: 25 }
    const result = new TempoContribuicaoStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })

  it('elegível mulher 30 anos contrib', () => {
    const input = { ...baseInput, gender: 'F' as const, tempoContribuicaoAnos: 30 }
    const result = new TempoContribuicaoStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível mulher com 25 anos contrib', () => {
    const input = { ...baseInput, gender: 'F' as const, tempoContribuicaoAnos: 25 }
    const result = new TempoContribuicaoStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })
})

describe('PontosStrategy', () => {
  it('modalidade correta', () => {
    expect(new PontosStrategy().modalidade).toBe('PONTOS_86_96')
  })

  it('elegível homem 65+35=100 pontos (>103)', () => {
    const input = { ...baseInput, idadeNaApuracao: 70, tempoContribuicaoAnos: 35 }
    const result = new PontosStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível — pontos insuficientes', () => {
    const input = { ...baseInput, idadeNaApuracao: 50, tempoContribuicaoAnos: 35 }
    const result = new PontosStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
    expect(result.pendencias[0]).toContain('Pontuação mínima')
  })

  it('elegível mulher 60+33=93 pontos', () => {
    const input = { ...baseInput, gender: 'F' as const, idadeNaApuracao: 60, tempoContribuicaoAnos: 33 }
    const result = new PontosStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })
})

describe('Pedagio50Strategy', () => {
  it('modalidade correta', () => {
    expect(new Pedagio50Strategy().modalidade).toBe('PEDAGIO_50')
  })

  it('elegível com tempo mínimo', () => {
    const result = new Pedagio50Strategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('fator previdenciário calculado', () => {
    const result = new Pedagio50Strategy().evaluate(baseInput)
    expect(result.fatorPrevidenciario).toBeDefined()
    expect(result.coeficiente).toBeGreaterThanOrEqual(0.4)
    expect(result.coeficiente).toBeLessThanOrEqual(1.2)
  })

  it('não elegível — tempo insuficiente', () => {
    const input = { ...baseInput, tempoContribuicaoAnos: 20 }
    const result = new Pedagio50Strategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })
})

describe('Pedagio100Strategy', () => {
  it('modalidade correta', () => {
    expect(new Pedagio100Strategy().modalidade).toBe('PEDAGIO_100')
  })

  it('elegível com idade e tempo mínimos', () => {
    const result = new Pedagio100Strategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('coeficiente fixo 1.0', () => {
    const result = new Pedagio100Strategy().evaluate(baseInput)
    expect(result.coeficiente).toBe(1.0)
  })

  it('não elegível — idade insuficiente', () => {
    const input = { ...baseInput, idadeNaApuracao: 50 }
    const result = new Pedagio100Strategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })
})

describe('AposentadoriaEspecialStrategy', () => {
  it('modalidade correta', () => {
    expect(new AposentadoriaEspecialStrategy().modalidade).toBe('APOSENTADORIA_ESPECIAL')
  })

  it('elegível com 60 anos e 25 anos contrib', () => {
    const result = new AposentadoriaEspecialStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível — idade insuficiente', () => {
    const input = { ...baseInput, idadeNaApuracao: 50 }
    const result = new AposentadoriaEspecialStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })

  it('não elegível — tempo especial insuficiente', () => {
    const input = { ...baseInput, tempoContribuicaoAnos: 20 }
    const result = new AposentadoriaEspecialStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })
})

describe('HibridaStrategy', () => {
  it('modalidade correta', () => {
    expect(new HibridaStrategy().modalidade).toBe('HIBRIDA')
  })

  it('elegível com idade e tempo mínimos', () => {
    const result = new HibridaStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('coeficiente baseado em tempo excedente', () => {
    const result = new HibridaStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBeGreaterThan(0.6)
  })

  it('não elegível — idade insuficiente', () => {
    const input = { ...baseInput, idadeNaApuracao: 50 }
    const result = new HibridaStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })
})

describe('AposentadoriaPCDStrategy', () => {
  it('modalidade correta', () => {
    expect(new AposentadoriaPCDStrategy().modalidade).toBe('APOSENTADORIA_PCD')
  })

  it('coeficiente sempre fixo em 1.0 (100% da média)', () => {
    const result = new AposentadoriaPCDStrategy().evaluate({ ...baseInput, disabilityDegree: 'GRAVE', tempoContribuicaoAnos: 25 })
    expect(result.coeficiente).toBe(1.0)
  })

  it('elegível por tempo de contribuição — grau grave (25 anos homem)', () => {
    const input = { ...baseInput, idadeNaApuracao: 45, tempoContribuicaoAnos: 25, disabilityDegree: 'GRAVE' as const }
    const result = new AposentadoriaPCDStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível por tempo — grau leve com apenas 25 anos (precisa de 33 para homem)', () => {
    const input = { ...baseInput, idadeNaApuracao: 45, tempoContribuicaoAnos: 25, disabilityDegree: 'LEVE' as const }
    const result = new AposentadoriaPCDStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })

  it('elegível por idade — 60 anos homem + 15 anos contrib, independente do grau', () => {
    const input = { ...baseInput, idadeNaApuracao: 60, tempoContribuicaoAnos: 15, disabilityDegree: undefined }
    const result = new AposentadoriaPCDStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })

  it('elegível por tempo — grau grave mulher com 20 anos', () => {
    const input = { ...baseInput, gender: 'F' as const, idadeNaApuracao: 45, tempoContribuicaoAnos: 20, disabilityDegree: 'GRAVE' as const }
    const result = new AposentadoriaPCDStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível sem grau informado e sem atingir a via de idade', () => {
    const input = { ...baseInput, idadeNaApuracao: 45, tempoContribuicaoAnos: 20, disabilityDegree: undefined }
    const result = new AposentadoriaPCDStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
    expect(result.pendencias.some((p) => p.includes('Grau de deficiência não informado'))).toBe(true)
  })

  it('não elegível — carência insuficiente mesmo com tempo de contribuição ok', () => {
    const input = { ...baseInput, idadeNaApuracao: 45, tempoContribuicaoAnos: 25, disabilityDegree: 'GRAVE' as const, carenciaMeses: 100 }
    const result = new AposentadoriaPCDStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
    expect(result.pendencias.some((p) => p.includes('Carência'))).toBe(true)
  })
})
