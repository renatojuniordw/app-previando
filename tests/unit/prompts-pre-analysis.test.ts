import { describe, it, expect } from 'vitest'
import {
  buildPreAnalysisUserPrompt,
  BPC_PRE_ANALYSIS_SYSTEM_PROMPT,
  BPC_CRITERIOS_LEGAIS,
} from '@/lib/prompts/bpc/pre-analysis'

describe('BPC_CRITERIOS_LEGAIS', () => {
  it('é string não vazia', () => {
    expect(BPC_CRITERIOS_LEGAIS.length).toBeGreaterThan(50)
  })

  it('contém critérios legais', () => {
    expect(BPC_CRITERIOS_LEGAIS).toContain('Renda')
    expect(BPC_CRITERIOS_LEGAIS).toContain('Impedimento')
  })
})

describe('BPC_PRE_ANALYSIS_SYSTEM_PROMPT', () => {
  it('é string não vazia', () => {
    expect(BPC_PRE_ANALYSIS_SYSTEM_PROMPT.length).toBeGreaterThan(100)
  })

  it('contém aviso de segurança', () => {
    expect(BPC_PRE_ANALYSIS_SYSTEM_PROMPT).toContain('SEGURANÇA')
  })

  it('contém regras invioláveis', () => {
    expect(BPC_PRE_ANALYSIS_SYSTEM_PROMPT).toContain('REGRAS INVIOLÁVEIS')
  })

  it('contém formato de resposta', () => {
    expect(BPC_PRE_ANALYSIS_SYSTEM_PROMPT).toContain('FORMATO DE RESPOSTA')
  })

  it('contém critérios legais', () => {
    expect(BPC_PRE_ANALYSIS_SYSTEM_PROMPT).toContain(BPC_CRITERIOS_LEGAIS)
  })
})

describe('buildPreAnalysisUserPrompt', () => {
  it('gera prompt com todos os dados', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Diabetes',
      cid: 'E11',
      idade: 45,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 2000,
      membrosGrupo: 3,
      rendaPerCapita: 666.67,
      salarioMinimoVigente: 1412,
      barreiras: 'Dificuldade locomoção',
    })
    expect(prompt).toContain('Diabetes')
    expect(prompt).toContain('E11')
    expect(prompt).toContain('45')
    expect(prompt).toContain('Dificuldade locomoção')
  })

  it('calcula limite de renda corretamente', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 2,
      rendaPerCapita: 500,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('353.00')
  })

  it('marca critério de renda como ATENDIDO', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 4,
      rendaPerCapita: 250,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('ATENDIDO')
  })

  it('marca critério de renda como NÃO ATENDIDO', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 10000,
      membrosGrupo: 2,
      rendaPerCapita: 5000,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('NÃO ATENDIDO')
  })

  it('gera prompt para menor de 16', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Autismo',
      idade: 10,
      faixaEtaria: 'MENOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 3,
      rendaPerCapita: 333,
      salarioMinimoVigente: 1412,
      barreiras: 'Isolamento',
    })
    expect(prompt).toContain('Menor de 16')
    expect(prompt).toContain('desenvolvimento')
  })

  it('inclui laudos quando fornecidos', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 2,
      rendaPerCapita: 500,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
      resumoLaudos: 'Laudo médico completo',
    })
    expect(prompt).toContain('Laudo médico completo')
  })

  it('indica laudos NÃO FORNECIDOS', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 2,
      rendaPerCapita: 500,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('NÃO FORNECIDO')
  })

  it('inclui relato social quando fornecido', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 2,
      rendaPerCapita: 500,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
      relatoSocial: 'Relato do advogado',
    })
    expect(prompt).toContain('RELATO DA ENTREVISTA SOCIAL')
  })

  it('inclui análise do laudo quando fornecida', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 2,
      rendaPerCapita: 500,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
      analiseLaudo: 'Laudo insuficiente',
    })
    expect(prompt).toContain('ANÁLISE DO LAUDO MÉDICO')
  })

  it('CID Não informado quando não fornecido', () => {
    const prompt = buildPreAnalysisUserPrompt({
      patologia: 'Teste',
      idade: 30,
      faixaEtaria: 'MAIOR_16',
      rendaFamiliar: 1000,
      membrosGrupo: 2,
      rendaPerCapita: 500,
      salarioMinimoVigente: 1412,
      barreiras: 'Barreiras',
    })
    expect(prompt).toContain('Não informado')
  })
})
