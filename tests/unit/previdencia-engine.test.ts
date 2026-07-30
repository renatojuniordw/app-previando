import { describe, it, expect } from 'vitest'
import { calculatePrevidenciario, projectSimulations } from '@/lib/previdencia-engine'
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

const mockCnisData: CnisExtractedData = {
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

describe('calculatePrevidenciario', () => {
  it('deve calcular aposentadoria por idade para homem', () => {
    const result = calculatePrevidenciario({
      birthDate: '1960-05-15',
      gender: 'M',
      dib: '2025-06-01',
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: mockCnisData,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.elegivel).toBe(true)
    expect(result.idadeNaApuracao).toBeGreaterThanOrEqual(65)
    expect(result.rmi).toBeGreaterThan(0)
    expect(result.salarioBeneficio).toBeGreaterThan(0)
    expect(result.coeficiente).toBeGreaterThan(0)
    expect(result.memoriaCalculo.contribuicoesConsideradas).toBeGreaterThan(0)
    expect(result.periodosSalarios.totalContribuicoes).toBeGreaterThan(0)
  })

  it('deve calcular aposentadoria por pontos', () => {
    const result = calculatePrevidenciario({
      birthDate: '1973-08-20',
      gender: 'F',
      dib: '2025-06-01',
      modalidade: 'PONTOS_86_96',
      extractedData: mockCnisData,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.rmi).toBeGreaterThan(0)
    expect(result.elegivel).toBeDefined()
    expect(result.coeficiente).toBeGreaterThan(0)
  })

  it('deve retornar RMI igual ao salário mínimo para BPC/LOAS', () => {
    const result = calculatePrevidenciario({
      birthDate: '1960-01-01',
      gender: 'M',
      dib: '2025-06-01',
      modalidade: 'BPC_LOAS',
      extractedData: null,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.rmi).toBe(1518.00)
    expect(result.modalidade).toBe('BPC_LOAS')
  })

  it('deve respeitar o teto previdenciário', () => {
    const highCnis: CnisExtractedData = {
      periodos: [
        {
          empregador: 'Alta Renda SA',
          inicio: '2015-01-01',
          fim: '2024-12-31',
          salarios: Array.from({ length: 120 }, (_, i) => ({
            competencia: `${2015 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`,
            valor: 15000.00,
          })),
          gaps: [],
        },
      ],
    }

    const result = calculatePrevidenciario({
      birthDate: '1970-03-10',
      gender: 'M',
      dib: '2025-06-01',
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: highCnis,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.rmi).toBeLessThanOrEqual(8157.41)
  })

  it('deve retornar pendencias quando não elegível', () => {
    const result = calculatePrevidenciario({
      birthDate: '2000-01-01',
      gender: 'M',
      dib: '2025-06-01',
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: null,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.elegivel).toBe(false)
    expect(result.pendencias.length).toBeGreaterThan(0)
  })

  it('deve calcular com dados mínimos (sem CNIS)', () => {
    const result = calculatePrevidenciario({
      birthDate: '1960-01-01',
      gender: 'M',
      dib: '2025-06-01',
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: null,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.elegivel).toBeDefined()
    expect(result.rmi).toBeGreaterThan(0)
    expect(result.memoriaCalculo.mediaSimples).toBeGreaterThan(0)
  })

  it('handles CNIS with empty periodos array', () => {
    const result = calculatePrevidenciario({
      birthDate: '1960-05-15',
      gender: 'M',
      dib: '2025-06-01',
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: { periodos: [] },
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.elegivel).toBeDefined()
  })

  it('handles CNIS with periodos that have null inicio/fim', () => {
    const cnisIncompleto: import('@/services/cnis/types').CnisExtractedData = {
      periodos: [
        {
          empregador: 'Emp X',
          inicio: null,
          fim: null,
          salarios: [],
          gaps: [],
        },
      ],
    }
    const result = calculatePrevidenciario({
      birthDate: '1960-05-15',
      gender: 'M',
      dib: '2025-06-01',
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: cnisIncompleto,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.elegivel).toBeDefined()
  })

  it('calculates age with day precision (edge case: ref day < birth day)', () => {
    const result = calculatePrevidenciario({
      birthDate: '1960-05-15',
      gender: 'M',
      dib: '2025-05-10',
      modalidade: 'APOSENTADORIA_IDADE',
      extractedData: null,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })
    expect(result.idadeNaApuracao).toBe(64)
  })
})

describe('projectSimulations', () => {
  it('deve projetar contribuições futuras', () => {
    const result = projectSimulations({
      birthDate: '1980-03-15',
      gender: 'M',
      dibProjetada: '2035-06-01',
      valorContribuicaoFutura: 4000,
      extractedData: mockCnisData,
      salarioMinimo: 1518.00,
      tetoPrevidenciario: 8157.41,
    })

    expect(result.rmiProjected).toBeGreaterThan(0)
    expect(result.rmaProjected).toBeGreaterThan(0)
    expect(result.gainVsNow).toBeGreaterThanOrEqual(0)
    expect(result.scenarioParams.competenciasSimuladas).toBeGreaterThan(0)
    expect(result.dibProjected).toBeTruthy()
  })
})
