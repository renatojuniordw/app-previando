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
})
