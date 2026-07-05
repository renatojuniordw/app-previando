import { describe, it, expect } from 'vitest'
import { getModalityLabel, mapToPortugueseCode, MODALIDADES_PADRAO } from '@/lib/modalidade-labels'

describe('MODALIDADES_PADRAO', () => {
  it('tem todas as modalidades padrão', () => {
    expect(MODALIDADES_PADRAO.length).toBeGreaterThan(10)
  })

  it('todas têm codigo, label e ordem', () => {
    for (const m of MODALIDADES_PADRAO) {
      expect(m.codigo).toBeDefined()
      expect(m.label).toBeDefined()
      expect(typeof m.ordem).toBe('number')
    }
  })

  it('ordens são únicas', () => {
    const ordens = MODALIDADES_PADRAO.map(m => m.ordem)
    const unique = new Set(ordens)
    expect(unique.size).toBe(ordens.length)
  })
})

describe('mapToPortugueseCode', () => {
  it('mapeia RETIREMENT_BY_AGE', () => {
    expect(mapToPortugueseCode('RETIREMENT_BY_AGE')).toBe('APOSENTADORIA_IDADE')
  })

  it('mapeia POINTS_86_96', () => {
    expect(mapToPortugueseCode('POINTS_86_96')).toBe('PONTOS_86_96')
  })

  it('mapeia TOLL_50', () => {
    expect(mapToPortugueseCode('TOLL_50')).toBe('PEDAGIO_50')
  })

  it('mapeia SPECIAL_RETIREMENT', () => {
    expect(mapToPortugueseCode('SPECIAL_RETIREMENT')).toBe('APOSENTADORIA_ESPECIAL')
  })

  it('mapeia DEATH_PENSION', () => {
    expect(mapToPortugueseCode('DEATH_PENSION')).toBe('PENSAO_MORTE')
  })

  it('retorna código inalterado quando não há mapeamento', () => {
    expect(mapToPortugueseCode('CODIGO_INEXISTENTE')).toBe('CODIGO_INEXISTENTE')
  })

  it('retorna código já em português inalterado', () => {
    expect(mapToPortugueseCode('APOSENTADORIA_IDADE')).toBe('APOSENTADORIA_IDADE')
  })
})

describe('getModalityLabel', () => {
  it('retorna label para código português', () => {
    expect(getModalityLabel('APOSENTADORIA_IDADE')).toBe('Aposentadoria por Idade')
  })

  it('retorna label para código inglês mapeado', () => {
    expect(getModalityLabel('RETIREMENT_BY_AGE')).toBe('Aposentadoria por Idade')
  })

  it('retorna label para BPC_LOAS', () => {
    expect(getModalityLabel('BPC_LOAS')).toBe('BPC/LOAS (Idoso)')
  })

  it('retorna código original quando não encontra', () => {
    expect(getModalityLabel('INEXISTENTE')).toBe('INEXISTENTE')
  })

  it('retorna label para PEDAGIO_100', () => {
    expect(getModalityLabel('TOLL_100')).toBe('Transição - Pedágio de 100%')
  })

  it('retorna label para HYBRID', () => {
    expect(getModalityLabel('HYBRID')).toBe('Aposentadoria Híbrida')
  })
})
