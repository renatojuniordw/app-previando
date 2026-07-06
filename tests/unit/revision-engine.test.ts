import { describe, it, expect } from 'vitest'
import { calcularRevisao } from '@/lib/revision-engine'
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

const mockCnisCompleto: CnisExtractedData = {
  periodos: [
    {
      empregador: 'Empresa ABC Ltda',
      inicio: '2010-01-01',
      fim: '2024-12-31',
      salarios: buildSalarios('2010-01', '2024-12', 3500.00),
      gaps: [],
    },
  ],
}

describe('calcularRevisao', () => {
  it('deve calcular revisão de benefício com CNIS processado', () => {
    const result = calcularRevisao({
      tipoRevisao: 'REVISAO_BENEFICIO',
      rmiConcedido: 3000.00,
      dibConcedido: '2025-06-01',
      birthDate: '1960-05-15',
      gender: 'M',
      extractedData: mockCnisCompleto,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.tipoRevisao).toBe('REVISAO_BENEFICIO')
    expect(result.rmiConcedido).toBe(3000.00)
    expect(result.rmiRevisado).toBeGreaterThan(0)
  })

  it('deve retornar pendência quando CNIS não foi processado', () => {
    const result = calcularRevisao({
      tipoRevisao: 'REVISAO_BENEFICIO',
      rmiConcedido: 3500.00,
      dibConcedido: '2025-06-01',
      birthDate: '1970-01-01',
      gender: 'M',
      extractedData: null,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.pendencias.length).toBeGreaterThan(0)
    expect(result.pendencias.some((p) => p.includes('CNIS'))).toBe(true)
  })

  it('deve gerar resultado com todas as propriedades preenchidas', () => {
    const result = calcularRevisao({
      tipoRevisao: 'REVISAO_BENEFICIO',
      rmiConcedido: 3500.00,
      dibConcedido: '2025-06-01',
      birthDate: '1960-05-15',
      gender: 'M',
      extractedData: mockCnisCompleto,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result).toHaveProperty('tipoRevisao')
    expect(result).toHaveProperty('rmiConcedido')
    expect(result).toHaveProperty('rmiRevisado')
    expect(result).toHaveProperty('diferencaMensal')
    expect(result).toHaveProperty('diferencaPercentual')
    expect(result).toHaveProperty('retroativos5Anos')
    expect(result).toHaveProperty('elegivel')
    expect(result).toHaveProperty('pendencias')
    expect(result).toHaveProperty('memoriaCalculo')
    expect(result.memoriaCalculo).toHaveProperty('salarioBeneficioOriginal')
    expect(result.memoriaCalculo).toHaveProperty('salarioBeneficioRevisado')
    expect(result.memoriaCalculo).toHaveProperty('coeficienteAplicado')
  })
})
