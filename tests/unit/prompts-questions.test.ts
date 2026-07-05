import { describe, it, expect } from 'vitest'
import {
  buildSocialQuestionsUserPrompt,
  buildMedicalQuestionsUserPrompt,
  BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT,
  BPC_MEDICAL_QUESTIONS_SYSTEM_PROMPT,
} from '@/lib/prompts/bpc/questions'

describe('BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT', () => {
  it('é string não vazia', () => {
    expect(BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT.length).toBeGreaterThan(50)
  })

  it('contém referências à CIF e Portaria', () => {
    expect(BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT).toContain('CIF')
    expect(BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT).toContain('Portaria')
  })
})

describe('BPC_MEDICAL_QUESTIONS_SYSTEM_PROMPT', () => {
  it('é string não vazia', () => {
    expect(BPC_MEDICAL_QUESTIONS_SYSTEM_PROMPT.length).toBeGreaterThan(50)
  })
})

describe('buildSocialQuestionsUserPrompt', () => {
  it('gera prompt com todos os dados', () => {
    const prompt = buildSocialQuestionsUserPrompt({
      patologia: 'Diabetes',
      cid: 'E11',
      idade: 45,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Dificuldade locomoção',
    })
    expect(prompt).toContain('Diabetes')
    expect(prompt).toContain('E11')
    expect(prompt).toContain('45')
    expect(prompt).toContain('Dificuldade locomoção')
  })

  it('gera prompt para menor de 16', () => {
    const prompt = buildSocialQuestionsUserPrompt({
      patologia: 'Autismo',
      idade: 10,
      faixaEtaria: 'MENOR_16',
      barreiras: 'Isolamento social',
    })
    expect(prompt).toContain('Menor de 16')
    expect(prompt).toContain('escola')
  })

  it('inclui pré-análise quando fornecida', () => {
    const prompt = buildSocialQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
      preAnalise: 'Análise prévia',
    })
    expect(prompt).toContain('PRÉ-ANÁLISE DO CASO')
  })

  it('inclui análise do laudo quando fornecida', () => {
    const prompt = buildSocialQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
      analiseLaudo: 'Laudo analisado',
    })
    expect(prompt).toContain('ANÁLISE DO LAUDO MÉDICO')
  })

  it('ignora campos opcionais vazios', () => {
    const prompt = buildSocialQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
      preAnalise: '',
      analiseLaudo: '  ',
    })
    expect(prompt).not.toContain('PRÉ-ANÁLISE DO CASO')
  })

  it('CID N/A quando não fornecido', () => {
    const prompt = buildSocialQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('N/A')
  })

  it('contém schema JSON esperado', () => {
    const prompt = buildSocialQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('dominios')
    expect(prompt).toContain('categoria')
    expect(prompt).toContain('perguntas')
  })
})

describe('buildMedicalQuestionsUserPrompt', () => {
  it('gera prompt com dados completos', () => {
    const prompt = buildMedicalQuestionsUserPrompt({
      patologia: 'Diabetes',
      cid: 'E11',
      idade: 50,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Dificuldade visual',
      resumoLaudos: 'Laudo completo',
    })
    expect(prompt).toContain('Diabetes')
    expect(prompt).toContain('E11')
    expect(prompt).toContain('Laudo completo')
  })

  it('gera prompt para menor de 16', () => {
    const prompt = buildMedicalQuestionsUserPrompt({
      patologia: 'Autismo',
      idade: 8,
      faixaEtaria: 'MENOR_16',
      barreiras: 'Isolamento',
    })
    expect(prompt).toContain('Menor de 16')
  })

  it('inclui relato social quando fornecido', () => {
    const prompt = buildMedicalQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
      relatoSocial: 'Relato social',
    })
    expect(prompt).toContain('RELATO DA ENTREVISTA SOCIAL')
  })

  it('inclui pré-análise quando fornecida', () => {
    const prompt = buildMedicalQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
      preAnalise: 'Análise prévia',
    })
    expect(prompt).toContain('PRÉ-ANÁLISE DO CASO')
  })

  it('laudos NÃO INFORMADO quando não fornecido', () => {
    const prompt = buildMedicalQuestionsUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('Não informado')
  })
})
