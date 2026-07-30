import { describe, it, expect } from 'vitest'
import { parseCnisProgrammatically } from '@/services/cnis/programmatic-parser'

function buildCnisText(overrides: {
  nit?: string
  nome?: string
  nasc?: string
  periods?: Array<{ salarios: Array<{ competencia: string; valor: string }> }>
} = {}) {
  const { nit = '123.45678.90-1', nome = 'João Silva', nasc = '', periods = [] } = overrides
  const lines: string[] = []
  lines.push(`NIT: ${nit}`)
  lines.push(`Nome: ${nome}`)
  if (nasc) lines.push(`Data de Nascimento: ${nasc}`)

  let seq = 1
  for (const p of periods) {
    lines.push(`Seq: ${seq}`)
    lines.push(`Empregador: Empresa ${seq}`)
    for (const s of p.salarios) {
      lines.push(`${s.competencia} ${s.valor}`)
    }
    seq++
  }

  return lines.join('\n')
}

describe('parseCnisProgrammatically', () => {
  it('returns null for empty string', () => {
    expect(parseCnisProgrammatically('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(parseCnisProgrammatically('   \n  \n  ')).toBeNull()
  })

  it('returns null for text without NIT', () => {
    const text = `Nome: João Silva\nSeq: 1\n01/2020 1500.00`
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('returns null for text without Nome', () => {
    const text = `NIT: 123.45678.90-1\nSeq: 1\n01/2020 1500.00`
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('accepts zero salary entries', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nSeq: 1\n01/2020 0.00`
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result!.extractedData.totalContribuicoes).toBe(1)
  })

  it('parses basic CNIS with NIT and Nome', () => {
    const text = buildCnisText({
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00' }] }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result!.extractedData.nit).toBe('123.45678.90-1')
    expect(result!.extractedData.nome).toBe('JOÃO SILVA')
  })

  it('parses PIS/PASEP as NIT', () => {
    const text = `PIS/PASEP: 12345678901\nNome: Maria Santos\nSeq: 1\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.nit).toBe('123.45678.90-1')
  })

  it('parses "Inscrição" as NIT', () => {
    const text = `Inscrição: 12345678901\nNome: Pedro Alves\nSeq: 1\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.nit).toBe('123.45678.90-1')
  })

  it('extracts NIT from multi-line format (NIT: on one line, number on next)', () => {
    const text = `NIT:\n123.45678.90-1\nNome: João Silva\nSeq: 1\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.nit).toBe('123.45678.90-1')
  })

  it('extracts Nome from multi-line format (Nome: on one line, name on next)', () => {
    const text = `NIT: 123.45678.90-1\nNome:\nJoão Silva\nSeq: 1\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.nome).toBe('JOÃO SILVA')
  })

  it('extracts birth date from single line format', () => {
    const text = buildCnisText({
      nasc: '15/05/1990',
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00' }] }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.dataNascimento).toBe('1990-05-15')
  })

  it('extracts birth date from label on one line and date on next', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nData de Nascimento:\n15/05/1990\nSeq: 1\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.dataNascimento).toBe('1990-05-15')
  })

  it('parses multiple competências in one period', () => {
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
    expect(result!.extractedData.totalContribuicoes).toBe(3)
  })

  it('calculates first and last contribution', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00' },
          { competencia: '12/2021', valor: '2000.00' },
        ],
      }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.primeiraContribuicao).toBe('2020-01')
    expect(result!.extractedData.ultimaContribuicao).toBe('2021-12')
  })

  it('generates markdown output', () => {
    const text = buildCnisText({
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00' }] }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result!.markdown.length).toBeGreaterThan(0)
  })

  it('detects gaps between salaries', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00' },
          { competencia: '03/2020', valor: '1700.00' },
        ],
      }],
    })
    const result = parseCnisProgrammatically(text)
    const gaps = result!.extractedData.periodos![0].gaps!
    expect(gaps).toContain('2020-02')
    expect(gaps).toHaveLength(1)
  })

  it('detects multiple gaps across year boundary', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '11/2020', valor: '1500.00' },
          { competencia: '02/2021', valor: '1700.00' },
        ],
      }],
    })
    const result = parseCnisProgrammatically(text)
    const gaps = result!.extractedData.periodos![0].gaps!
    expect(gaps).toContain('2020-12')
    expect(gaps).toContain('2021-01')
    expect(gaps).toHaveLength(2)
  })

  it('returns null when all salaries are BLOQ-EC103', () => {
    const text = buildCnisText({
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1500.00 BLOQ-EC103' }] }],
    })
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('filters out BLOQ-EC103 salary but keeps valid ones', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00 BLOQ-EC103' },
          { competencia: '02/2020', valor: '1600.00' },
        ],
      }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.totalContribuicoes).toBe(1)
    expect(result!.extractedData.periodos![0].salarios[0].competencia).toBe('2020-02')
  })

  it('filters out PREM-FVIN salaries', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00 PREM-FVIN' },
        ],
      }],
    })
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('filters out PREM-BLOQ-EC103 salaries', () => {
    const text = buildCnisText({
      periods: [{
        salarios: [
          { competencia: '01/2020', valor: '1500.00 PREM-BLOQ-EC103' },
        ],
      }],
    })
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('handles multi-line salary layout (comp on one line, value on next)', () => {
    // In multi-line, competência on its own line, then next line is the value
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nSeq: 1\n01/2020\n1500.00\n02/2020\n1600.00`
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result!.extractedData.totalContribuicoes).toBe(2)
  })

  it('parses CNPJ without Seq to trigger new period', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nCNPJ: 12345678000190\nEmpresa ABC\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result!.extractedData.nit).toBe('123.45678.90-1')
  })

  it('detects Relação Previdenciária pattern', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nRelação Previdenciária: 123\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result!.extractedData.totalContribuicoes).toBe(1)
    expect(result!.extractedData.periodos![0].salarios[0].competencia).toBe('2020-01')
  })

  it('detects BENEFICIO period and excludes it from output', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nSeq: 1\nEmpregador: BENEFICIO PREVIDENCIARIO\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result).toBeNull()
  })

  it('detects BENEFÍCIO (accented) and excludes it', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nSeq: 1\nEmpregador: BENEFÍCIO ESPECIAL\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result).toBeNull()
  })

  it('detects B99 pattern as benefício', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nSeq: 1\nB99 - Benefício\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result).toBeNull()
  })

  it('parses salary with Brazilian number format', () => {
    const text = buildCnisText({
      periods: [{ salarios: [{ competencia: '01/2020', valor: '1.500,50' }] }],
    })
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.periodos![0].salarios[0].valor).toBe(1500.5)
  })

  it('handles empty periods array gracefully', () => {
    const text = buildCnisText({ periods: [] })
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('rejects Nome with single word only', () => {
    const text = `NIT: 123.45678.90-1\nNome: Joao\nSeq: 1\n01/2020 1500.00`
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('rejects Nome containing SEGURADO', () => {
    const text = `NIT: 123.45678.90-1\nNome: DO SEGURADO\nSeq: 1\n01/2020 1500.00`
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('rejects Nome containing CNIS', () => {
    const text = `NIT: 123.45678.90-1\nNome: CNIS INFORMA\nSeq: 1\n01/2020 1500.00`
    expect(parseCnisProgrammatically(text)).toBeNull()
  })

  it('handles "Seq." without number, finds number in next lines', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nSeq.\n1\nCNPJ: 12345678000190\nEmpresa X\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result).not.toBeNull()
    expect(result!.extractedData.totalContribuicoes).toBe(1)
  })

  it('parses multi-period CNIS with multiple employers', () => {
    const text = buildCnisText({
      periods: [
        { salarios: [{ competencia: '01/2020', valor: '1500.00' }] },
        { salarios: [{ competencia: '06/2020', valor: '2000.00' }] },
      ],
    })
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.periodos).toHaveLength(2)
    expect(result!.extractedData.totalContribuicoes).toBe(2)
  })

  it('parses "Nascimento:" as birth date label', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nNascimento: 15/05/1990\nSeq: 1\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.dataNascimento).toBe('1990-05-15')
  })

  it('parses "D.Nasc" as birth date label', () => {
    const text = `NIT: 123.45678.90-1\nNome: João Silva\nD.Nasc: 15/05/1990\nSeq: 1\n01/2020 1500.00`
    const result = parseCnisProgrammatically(text)
    expect(result!.extractedData.dataNascimento).toBe('1990-05-15')
  })
})
