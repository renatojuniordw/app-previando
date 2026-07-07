import { describe, it, expect } from 'vitest'
import { CalculationModality, CaseStatus, BenefitType, NoteType } from '@prisma/client'
import type { ApiBenefitType } from '@/lib/mappers'
import {
  mapModalidadeToDb,
  mapCaseStatusToDb,
  mapCaseStatusToApi,
  mapBenefitTypeToDb,
  mapBenefitTypeToApi,
  mapNoteTypeToDb,
  mapNoteTypeToApi,
  mapCaseToApi,
  mapNoteToApi,
  getModalitiesForBenefit,
} from '@/lib/mappers'

describe('mapModalidadeToDb', () => {
  it('deve mapear APOSENTADORIA_IDADE para RETIREMENT_BY_AGE', () => {
    expect(mapModalidadeToDb('APOSENTADORIA_IDADE')).toBe(CalculationModality.RETIREMENT_BY_AGE)
  })

  it('deve mapear PONTOS_86_96 para POINTS_86_96', () => {
    expect(mapModalidadeToDb('PONTOS_86_96')).toBe(CalculationModality.POINTS_86_96)
  })

  it('deve retornar fallback para modalidade desconhecida', () => {
    expect(mapModalidadeToDb('MODALIDADE_INVALIDA')).toBe(CalculationModality.RETIREMENT_BY_AGE)
  })
})

describe('mapCaseStatusToDb', () => {
  it('deve mapear PROSPECCAO para PROSPECTING', () => {
    expect(mapCaseStatusToDb('PROSPECCAO')).toBe(CaseStatus.PROSPECTING)
  })

  it('deve mapear ANALISE para ANALYSIS', () => {
    expect(mapCaseStatusToDb('ANALISE')).toBe(CaseStatus.ANALYSIS)
  })

  it('deve mapear FINALIZADO para FINISHED', () => {
    expect(mapCaseStatusToDb('FINALIZADO')).toBe(CaseStatus.FINISHED)
  })
})

describe('mapCaseStatusToApi', () => {
  it('deve mapear PROSPECTING para PROSPECCAO', () => {
    expect(mapCaseStatusToApi(CaseStatus.PROSPECTING)).toBe('PROSPECCAO')
  })

  it('deve mapear FINISHED para FINALIZADO', () => {
    expect(mapCaseStatusToApi(CaseStatus.FINISHED)).toBe('FINALIZADO')
  })
})

describe('mapBenefitTypeToDb', () => {
  it('deve mapear APOSENTADORIA_IDADE para RETIREMENT_BY_AGE', () => {
    expect(mapBenefitTypeToDb('APOSENTADORIA_IDADE')).toBe(BenefitType.RETIREMENT_BY_AGE)
  })

  it('deve mapear BPC_LOAS para BPC_LOAS', () => {
    expect(mapBenefitTypeToDb('BPC_LOAS')).toBe(BenefitType.BPC_LOAS)
  })

  it('deve mapear REVISAO_BENEFICIO para BENEFIT_REVIEW', () => {
    expect(mapBenefitTypeToDb('REVISAO_BENEFICIO')).toBe(BenefitType.BENEFIT_REVIEW)
  })
})

describe('mapBenefitTypeToApi', () => {
  it('deve mapear BENEFIT_REVIEW para REVISAO_BENEFICIO', () => {
    expect(mapBenefitTypeToApi(BenefitType.BENEFIT_REVIEW)).toBe('REVISAO_BENEFICIO')
  })

  it('deve mapear DEATH_PENSION para PENSAO_POR_MORTE', () => {
    expect(mapBenefitTypeToApi(BenefitType.DEATH_PENSION)).toBe('PENSAO_POR_MORTE')
  })
})

describe('mapNoteTypeToDb', () => {
  it('deve mapear CONTATO para CONTACT', () => {
    expect(mapNoteTypeToDb('CONTATO')).toBe(NoteType.CONTACT)
  })

  it('deve mapear BPC para BPC_ANALYSIS', () => {
    expect(mapNoteTypeToDb('BPC')).toBe(NoteType.BPC_ANALYSIS)
  })
})

describe('mapNoteTypeToApi', () => {
  it('deve mapear BPC_ANALYSIS para BPC', () => {
    expect(mapNoteTypeToApi(NoteType.BPC_ANALYSIS)).toBe('BPC')
  })
})

describe('mapCaseToApi', () => {
  it('deve mapear todos os enums de um caso', () => {
    const input = {
      id: 'case-1',
      status: CaseStatus.ANALYSIS,
      benefitType: BenefitType.BPC_LOAS,
      clientName: 'João',
    }
    const result = mapCaseToApi(input)
    expect(result.status).toBe('ANALISE')
    expect(result.benefitType).toBe('BPC_LOAS')
    expect(result.clientName).toBe('João')
    expect(result.id).toBe('case-1')
  })
})

describe('mapNoteToApi', () => {
  it('deve mapear o tipo da nota', () => {
    const input = { id: 'note-1', type: NoteType.CONTACT, content: 'teste' }
    const result = mapNoteToApi(input)
    expect(result.type).toBe('CONTATO')
    expect(result.content).toBe('teste')
  })
})

describe('getModalitiesForBenefit', () => {
  it('deve retornar modalidades para APOSENTADORIA_IDADE', () => {
    const mods = getModalitiesForBenefit('APOSENTADORIA_IDADE')
    expect(mods).toContain('APOSENTADORIA_IDADE')
    expect(mods).toContain('TEMPO_CONTRIBUICAO')
    expect(mods).toContain('PONTOS_86_96')
  })

  it('deve retornar modalidades para AUXILIO_DOENCA', () => {
    const mods = getModalitiesForBenefit('AUXILIO_DOENCA')
    expect(mods).toEqual(['AUXILIO_DOENCA_B31', 'AUXILIO_DOENCA_B91'])
  })

  it('deve retornar array vazio para AUXILIO_ACIDENTE', () => {
    const mods = getModalitiesForBenefit('AUXILIO_ACIDENTE')
    expect(mods).toEqual([])
  })

  it('deve retornar array vazio para beneficio desconhecido', () => {
    const mods = getModalitiesForBenefit('INEXISTENTE' as ApiBenefitType)
    expect(mods).toEqual([])
  })

  it('deve retornar BPC_LOAS para BPC_LOAS', () => {
    const mods = getModalitiesForBenefit('BPC_LOAS')
    expect(mods).toEqual(['BPC_LOAS'])
  })
})
