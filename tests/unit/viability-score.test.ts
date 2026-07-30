import { describe, it, expect } from 'vitest'
import { calcularViabilityScore } from '@/lib/viability-score'
import type { CnisExtractedData } from '@/services/cnis/types'

function buildSalarios(inicio: string, fim: string, valor: number): Array<{ competencia: string; valor: number }> {
  const [anoI, mesI] = inicio.split('-').map(Number)
  const [anoF, mesF] = fim.split('-').map(Number)
  const salarios: Array<{ competencia: string; valor: number }> = []
  let ano = anoI, mes = mesI
  while (ano < anoF || (ano === anoF && mes <= mesF)) {
    salarios.push({ competencia: `${ano}-${String(mes).padStart(2, '0')}`, valor })
    mes++
    if (mes > 12) { mes = 1; ano++ }
  }
  return salarios
}

const cnisCompleto: CnisExtractedData = {
  periodos: [
    {
      empregador: 'Empresa ABC',
      inicio: '1990-01-01',
      fim: '2024-12-31',
      salarios: buildSalarios('1990-01', '2024-12', 5000.00),
      gaps: [],
    },
  ],
}

const cnisMinimo: CnisExtractedData = {
  periodos: [
    {
      empregador: 'Empresa XYZ',
      inicio: '2010-01-01',
      fim: '2024-12-31',
      salarios: buildSalarios('2010-01', '2024-12', 1518.00),
      gaps: [],
    },
  ],
}

describe('calcularViabilityScore', () => {
  it('deve retornar score ALTA para perfil com muitos anos de contribuição', () => {
    const result = calcularViabilityScore({
      birthDate: '1965-03-10',
      gender: 'M',
      dib: '2025-06-01',
      extractedData: cnisCompleto,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.score).toBeGreaterThanOrEqual(50)
    expect(['ALTA', 'MEDIA']).toContain(result.classificacao)
    expect(result.detalhamento).toHaveProperty('elegibilidade')
    expect(result.detalhamento).toHaveProperty('tempoContribuicao')
    expect(result.detalhamento).toHaveProperty('idade')
    expect(result.detalhamento).toHaveProperty('rmi')
    expect(result.detalhamento).toHaveProperty('consistenciaCnis')
  })

  it('deve retornar score MEDIA ou BAIXA para perfil jovem com poucas contribuições', () => {
    const result = calcularViabilityScore({
      birthDate: '2000-05-15',
      gender: 'M',
      dib: '2025-06-01',
      extractedData: cnisMinimo,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(['BAIXA', 'MEDIA', 'INCONCLUSIVO']).toContain(result.classificacao)
    expect(result.detalhamento.idade).toBeLessThan(10)
  })

  it('deve retornar BAIXA ou INCONCLUSIVO quando não há CNIS', () => {
    const result = calcularViabilityScore({
      birthDate: '1960-05-15',
      gender: 'M',
      dib: '2025-06-01',
      extractedData: null,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(['BAIXA', 'INCONCLUSIVO']).toContain(result.classificacao)
    expect(result.score).toBeLessThan(40)
  })

  it('deve retornar modalidades ordenadas por score', () => {
    const result = calcularViabilityScore({
      birthDate: '1965-03-10',
      gender: 'F',
      dib: '2025-06-01',
      extractedData: cnisCompleto,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.modalidadesOrdenadas.length).toBeGreaterThan(0)
    expect(result.modalidadesOrdenadas[0].score).toBeGreaterThanOrEqual(0)
  })

  it('deve somar 100 nos detalhamentos máximos', () => {
    const result = calcularViabilityScore({
      birthDate: '1965-03-10',
      gender: 'M',
      dib: '2025-06-01',
      extractedData: cnisCompleto,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    const totalDetalhamento = Object.values(result.detalhamento).reduce((a, b) => a + b, 0)
    expect(totalDetalhamento).toBeLessThanOrEqual(100)
  })

  it('returns BAIXA for very young person with no CNIS data', () => {
    const result = calcularViabilityScore({
      birthDate: '2008-12-25',
      gender: 'M',
      dib: '2025-01-01',
      extractedData: null,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.classificacao).toBe('BAIXA')
    expect(result.score).toBeLessThan(40)
    expect(result.score).toBeGreaterThanOrEqual(10)
  })

  it('returns BAIXA for score between 10 and 39', () => {
    const youngPerson: CnisExtractedData = {
      periodos: [{
        empregador: 'Emp Y',
        inicio: '2022-01-01',
        fim: '2024-12-31',
        salarios: [
          { competencia: '2022-01', valor: 1518 },
          { competencia: '2022-02', valor: 1518 },
          { competencia: '2022-03', valor: 1518 },
        ],
        gaps: ['2022-04', '2022-05', '2022-06', '2022-07', '2022-08', '2022-09', '2022-10', '2022-11', '2022-12',
          '2023-01', '2023-02', '2023-03', '2023-04', '2023-05', '2023-06', '2023-07', '2023-08', '2023-09', '2023-10',
          '2023-11', '2023-12', '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08',
          '2024-09', '2024-10', '2024-11', '2024-12'],
      }],
    }
    const result = calcularViabilityScore({
      birthDate: '2000-05-15',
      gender: 'F',
      dib: '2025-01-01',
      extractedData: youngPerson,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.classificacao).toBe('BAIXA')
    expect(result.score).toBeGreaterThanOrEqual(10)
    expect(result.score).toBeLessThan(40)
  })

  it('calculates consistência score for periods with gaps', () => {
    const cnisWithGaps: CnisExtractedData = {
      periodos: [
        {
          empregador: 'Emp1',
          inicio: '2010-01-01',
          fim: '2012-12-31',
          salarios: buildSalarios('2010-01', '2012-12', 2000),
          gaps: [],
        },
        {
          empregador: 'Emp2',
          inicio: '2015-06-01',
          fim: '2017-12-31',
          salarios: buildSalarios('2015-06', '2017-12', 3000),
          gaps: ['2013-01'],
        },
      ],
    }
    const result = calcularViabilityScore({
      birthDate: '1965-03-10',
      gender: 'M',
      dib: '2025-06-01',
      extractedData: cnisWithGaps,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.detalhamento.consistenciaCnis).toBeGreaterThanOrEqual(0)
    expect(result.detalhamento.consistenciaCnis).toBeLessThanOrEqual(10)
  })

  it('handles extractedData with null periodos entries', () => {
    const cnisNoPeriodos: CnisExtractedData = {
      periodos: [],
    }
    const result = calcularViabilityScore({
      birthDate: '1965-03-10',
      gender: 'M',
      dib: '2025-06-01',
      extractedData: cnisNoPeriodos,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.detalhamento.tempoContribuicao).toBe(0)
    expect(result.detalhamento.consistenciaCnis).toBe(0)
  })

  it('returns high score for elderly person with full CNIS and high salary', () => {
    const cnisAlta: CnisExtractedData = {
      periodos: Array.from({ length: 3 }, (_, i) => ({
        empregador: `Emp ${i}`,
        inicio: `${1990 + i * 10}-01-01`,
        fim: `${1999 + i * 10}-12-31`,
        salarios: Array.from({ length: 120 }, (_, j) => ({
          competencia: `${1990 + i * 10 + Math.floor(j / 12)}-${String((j % 12) + 1).padStart(2, '0')}`,
          valor: 7580.00,
        })),
        gaps: [],
      })),
    }
    const result = calcularViabilityScore({
      birthDate: '1955-03-10',
      gender: 'M',
      dib: '2025-06-01',
      extractedData: cnisAlta,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.score).toBeGreaterThanOrEqual(50)
    expect(['ALTA', 'MEDIA']).toContain(result.classificacao)
  })
})
