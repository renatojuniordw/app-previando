import { describe, it, expect } from 'vitest'
import { calcularContribuicao, getAliquotasDisponiveis, getCategorias } from '@/lib/gps-engine'

const SM = 1518.00
const TETO = 8157.41

describe('calcularContribuicao', () => {
  it('deve calcular CI plano normal (20%) sobre o SM', () => {
    const result = calcularContribuicao({
      categoria: 'CI',
      plano: 'NORMAL',
      salarioContribuicao: SM,
      competencia: '2026-06',
      salarioMinimo: SM,
      tetoPrevidenciario: TETO,
    })

    expect(result.aliquota).toBe(0.20)
    expect(result.valorCalculado).toBe(303.60) // 1518 * 0.20
    expect(result.codigoPagamento).toBe('1406')
  })

  it('deve calcular CI plano simplificado (11%)', () => {
    const result = calcularContribuicao({
      categoria: 'CI',
      plano: 'SIMPLIFICADO',
      salarioContribuicao: SM,
      competencia: '2026-06',
      salarioMinimo: SM,
      tetoPrevidenciario: TETO,
    })

    expect(result.aliquota).toBe(0.11)
    expect(result.valorCalculado).toBe(166.98) // 1518 * 0.11
    expect(result.codigoPagamento).toBe('1163')
  })

  it('deve calcular Facultativo baixa renda (5%)', () => {
    const result = calcularContribuicao({
      categoria: 'FACULTATIVO',
      plano: 'BAIXA_RENDA',
      salarioContribuicao: SM,
      competencia: '2026-06',
      salarioMinimo: SM,
      tetoPrevidenciario: TETO,
    })

    expect(result.aliquota).toBe(0.05)
    expect(result.valorCalculado).toBe(75.90) // 1518 * 0.05
    expect(result.codigoPagamento).toBe('1310')
  })

  it('deve calcular MEI (5% do SM)', () => {
    const result = calcularContribuicao({
      categoria: 'MEI',
      plano: 'NORMAL',
      salarioContribuicao: 5000, // MEI ignora — usa SM
      competencia: '2026-06',
      salarioMinimo: SM,
      tetoPrevidenciario: TETO,
    })

    expect(result.salarioContribuicao).toBe(SM)
    expect(result.aliquota).toBe(0.05)
    expect(result.valorCalculado).toBe(75.90)
    expect(result.codigoPagamento).toBe('1609')
  })

  it('deve respeitar o teto previdenciário', () => {
    const result = calcularContribuicao({
      categoria: 'CI',
      plano: 'NORMAL',
      salarioContribuicao: 20000, // acima do teto
      competencia: '2026-06',
      salarioMinimo: SM,
      tetoPrevidenciario: TETO,
    })

    expect(result.salarioContribuicao).toBe(TETO)
    expect(result.valorCalculado).toBe(Number((TETO * 0.20).toFixed(2)))
  })

  it('deve respeitar o piso do salário mínimo', () => {
    const result = calcularContribuicao({
      categoria: 'CI',
      plano: 'NORMAL',
      salarioContribuicao: 500, // abaixo do SM
      competencia: '2026-06',
      salarioMinimo: SM,
      tetoPrevidenciario: TETO,
    })

    expect(result.salarioContribuicao).toBe(SM)
  })

  it('deve calcular Segurado Especial (2,3%)', () => {
    const result = calcularContribuicao({
      categoria: 'SEGURADO_ESPECIAL',
      plano: 'NORMAL',
      salarioContribuicao: SM,
      competencia: '2026-06',
      salarioMinimo: SM,
      tetoPrevidenciario: TETO,
    })

    expect(result.aliquota).toBe(0.023)
    expect(result.codigoPagamento).toBe('1631')
  })
})

describe('getAliquotasDisponiveis', () => {
  it('deve retornar aliquotas para CI', () => {
    const aliquotas = getAliquotasDisponiveis('CI')
    expect(aliquotas.length).toBeGreaterThanOrEqual(2)
    expect(aliquotas.some((a) => a.plano === 'NORMAL')).toBe(true)
    expect(aliquotas.some((a) => a.plano === 'SIMPLIFICADO')).toBe(true)
  })
})

describe('getCategorias', () => {
  it('deve retornar 4 categorias', () => {
    const categorias = getCategorias()
    expect(categorias).toHaveLength(4)
    expect(categorias.map((c) => c.categoria)).toContain('CI')
    expect(categorias.map((c) => c.categoria)).toContain('MEI')
  })
})
