import { describe, it, expect } from 'vitest'
import { parseCnisProgrammatically } from '@/services/cnis/programmatic-parser'

interface CnisSalary {
  competencia: string
  valor: string
}

interface CnisPeriod {
  salarios: CnisSalary[]
}

interface CnisOverride {
  nit?: string
  nome?: string
  nasc?: string
  periods?: CnisPeriod[]
}

function buildCnisText(overrides: CnisOverride = {}) {
  const { nit = '123.45678.90-1', nome = 'João Silva', nasc = '', periods = [] } = overrides
  const salaryLines = periods.flatMap(p =>
    p.salarios.map(s => `${s.competencia} ${s.valor}`)
  )
  return [
    `NIT: ${nit}`,
    `Nome: ${nome}`,
    nasc ? `Data de Nascimento: ${nasc}` : null,
    `Seq: 1`,
    `CNPJ: 12345678000190`,
    `Empresa Test`,
    ...salaryLines,
  ].filter(Boolean).join('\n')
}

describe('parseCnisProgrammatically', () => {
  it('retorna null para string vazia', () => {
    expect(parseCnisProgrammatically('')).toBeNull()
  })

  it('retorna null para string sem dados', () => {
    expect(parseCnisProgrammatically('texto aleatório')).toBeNull()
  })

  it('retorna null quando não tem NIT', () => {
    const text = `Nome: João Silva
Seq: 1
01/2020 1500.00`
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('retorna null quando não tem Nome', () => {
    const text = `NIT: 123.45678.90-1
Seq: 1
01/2020 1500.00`
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('parse CNIS básico', () => {
    const text = buildCnisText({
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00' }] }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result?.extractedData.nit).toBe('123.45678.90-1')
    expect(result?.extractedData.nome).toBe('JOÃO SILVA')
  })

  it('parse múltiplas competências', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00' },
          { competencia: '02/2020', valor: '1600.00' },
          { competencia: '03/2020', valor: '1700.00' },
        ],
      }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result?.extractedData.totalContribuicoes).toBe(3)
  })

  it('calcula primeira e última contribuição', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00' },
          { competencia: '12/2021', valor: '2000.00' },
        ],
      }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result?.extractedData.primeiraContribuicao).toBe('2020-01')
    expect(result?.extractedData.ultimaContribuicao).toBe('2021-12')
  })

  it('markdown é gerado', () => {
    const text = buildCnisText({
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00' }] }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result?.markdown.length).toBeGreaterThan(0)
  })

  it('parse com data de nascimento', () => {
    const text = buildCnisText({
      nasc: '15/05/1990',
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00' }] }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result?.extractedData.dataNascimento).toBe('1990-05-15')
  })

  it('parse PIS/PASEP como NIT', () => {
    const text = `PIS/PASEP: 12345678901
Nome: Maria Santos
Seq: 1
01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result?.extractedData.nit).toBe('123.45678.90-1')
  })

  it('retorna null quando todos salários são BLOQ', () => {
    const text = buildCnisText({
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00 BLOQ-EC103' }] }],
    })
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('periodos têm gaps detectados', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00' },
          { competencia: '03/2020', valor: '1700.00' },
        ],
      }],
    })
    const result = parseCnisProgrammatically(text)
    const gaps = result?.extractedData.periodos?.[0]?.gaps ?? []
    expect(gaps).toContain('2020-02')
  })
})
