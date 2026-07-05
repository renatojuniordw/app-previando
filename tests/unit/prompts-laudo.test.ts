import { describe, it, expect } from 'vitest'
import { buildLaudoAnalysisUserPrompt, BPC_LAUDO_SYSTEM_PROMPT } from '@/lib/prompts/bpc/laudo-analysis'

describe('BPC_LAUDO_SYSTEM_PROMPT', () => {
  it('é string não vazia', () => {
    expect(BPC_LAUDO_SYSTEM_PROMPT.length).toBeGreaterThan(50)
  })

  it('contém referências à Portaria e CIF', () => {
    expect(BPC_LAUDO_SYSTEM_PROMPT).toContain('Portaria')
    expect(BPC_LAUDO_SYSTEM_PROMPT).toContain('CIF')
  })

  it('contém aviso de segurança', () => {
    expect(BPC_LAUDO_SYSTEM_PROMPT).toContain('SEGURANÇA')
  })
})

describe('buildLaudoAnalysisUserPrompt', () => {
  it('gera prompt com dados básicos', () => {
    const prompt = buildLaudoAnalysisUserPrompt({
      patologia: 'Diabetes',
      faixaEtaria: 'MAIOR_16',
      laudo: 'Paciente com diabetes tipo 2',
    })
    expect(prompt).toContain('Diabetes')
    expect(prompt).toContain('Paciente com diabetes')
    expect(prompt).toContain('Maior de 16')
  })

  it('gera prompt para menor de 16', () => {
    const prompt = buildLaudoAnalysisUserPrompt({
      patologia: 'Autismo',
      faixaEtaria: 'MENOR_16',
      laudo: 'Laudo médico',
    })
    expect(prompt).toContain('Menor de 16')
  })

  it('inclui pré-análise quando fornecida', () => {
    const prompt = buildLaudoAnalysisUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      laudo: 'Laudo',
      preAnalise: 'Lacunas identificadas',
    })
    expect(prompt).toContain('PRÉ-ANÁLISE DO CASO')
    expect(prompt).toContain('10.')
  })

  it('não inclui item 10 quando sem pré-análise', () => {
    const prompt = buildLaudoAnalysisUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      laudo: 'Laudo',
    })
    expect(prompt).not.toContain('10.')
  })

  it('contém critérios de avaliação', () => {
    const prompt = buildLaudoAnalysisUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      laudo: 'Laudo',
    })
    expect(prompt).toContain('impedimento de longo prazo')
    expect(prompt).toContain('Classificação final')
  })
})
