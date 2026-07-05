import { describe, it, expect } from 'vitest'
import {
  BENEFIT_LABELS,
  BENEFIT_SHORT_LABELS,
  BENEFIT_DB_LABELS,
  STATUS_LABELS,
  PRIORITY_STYLES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  OPINION_STATUS_LABELS,
} from '@/lib/constants'

describe('BENEFIT_LABELS', () => {
  it('tem todos os benefícios esperados', () => {
    expect(BENEFIT_LABELS.APOSENTADORIA_IDADE).toBe('Aposentadoria por Idade')
    expect(BENEFIT_LABELS.APOSENTADORIA_ESPECIAL).toBe('Aposentadoria Especial')
    expect(BENEFIT_LABELS.BPC_LOAS).toBe('BPC/LOAS')
    expect(BENEFIT_LABELS.AUXILIO_DOENCA).toBe('Auxílio-Doença')
    expect(BENEFIT_LABELS.PENSAO_POR_MORTE).toBe('Pensão por Morte')
  })

  it('tem 12 benefícios', () => {
    expect(Object.keys(BENEFIT_LABELS).length).toBe(12)
  })
})

describe('BENEFIT_SHORT_LABELS', () => {
  it('tem labels encurtados', () => {
    expect(BENEFIT_SHORT_LABELS.APOSENTADORIA_IDADE).toBe('Apos. por Idade')
    expect(BENEFIT_SHORT_LABELS.APOSENTADORIA_ESPECIAL).toBe('Apos. Especial')
  })

  it('tem mesma quantidade que BENEFIT_LABELS', () => {
    expect(Object.keys(BENEFIT_SHORT_LABELS).length).toBe(Object.keys(BENEFIT_LABELS).length)
  })
})

describe('BENEFIT_DB_LABELS', () => {
  it('mapeia códigos de banco para labels', () => {
    expect(BENEFIT_DB_LABELS.RETIREMENT_BY_AGE).toBe('Idade')
    expect(BENEFIT_DB_LABELS.SPECIAL_RETIREMENT).toBe('Especial')
    expect(BENEFIT_DB_LABELS.BPC_LOAS).toBe('BPC/LOAS')
  })
})

describe('STATUS_LABELS', () => {
  it('tem todos os status', () => {
    expect(STATUS_LABELS.PROSPECCAO).toBe('Prospecção')
    expect(STATUS_LABELS.ANALISE).toBe('Análise')
    expect(STATUS_LABELS.PRONTO_PARA_REQUERER).toBe('Pronto p/ Requerer')
    expect(STATUS_LABELS.EM_PROCESSAMENTO).toBe('Em Processamento')
    expect(STATUS_LABELS.FINALIZADO).toBe('Finalizado')
  })
})

describe('PRIORITY_STYLES', () => {
  it('tem estilos para todas as prioridades', () => {
    expect(PRIORITY_STYLES.CRITICAL).toEqual({ label: 'Crítico', color: 'red' })
    expect(PRIORITY_STYLES.ATTENTION).toEqual({ label: 'Atenção', color: 'yellow' })
    expect(PRIORITY_STYLES.NORMAL).toEqual({ label: 'Normal', color: 'slate' })
  })
})

describe('PRIORITY_LABELS', () => {
  it('tem labels para todas as prioridades', () => {
    expect(PRIORITY_LABELS.CRITICAL).toBe('Crítico')
    expect(PRIORITY_LABELS.ATTENTION).toBe('Atenção')
    expect(PRIORITY_LABELS.NORMAL).toBe('Normal')
  })
})

describe('PRIORITY_COLORS', () => {
  it('tem cores hex para todas as prioridades', () => {
    expect(PRIORITY_COLORS.CRITICAL).toBe('#ef4444')
    expect(PRIORITY_COLORS.ATTENTION).toBe('#f59e0b')
    expect(PRIORITY_COLORS.NORMAL).toBe('#10b981')
  })
})

describe('OPINION_STATUS_LABELS', () => {
  it('tem labels para status de parecer', () => {
    expect(OPINION_STATUS_LABELS.GENERATED).toBe('Gerado')
    expect(OPINION_STATUS_LABELS.REVIEWED).toBe('Revisado')
    expect(OPINION_STATUS_LABELS.FINALIZED).toBe('Final')
  })
})
