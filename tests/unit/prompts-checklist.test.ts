import { describe, it, expect } from 'vitest'
import { buildChecklistUserPrompt, BPC_CHECKLIST_SYSTEM_PROMPT } from '@/lib/prompts/bpc/checklist'

describe('BPC_CHECKLIST_SYSTEM_PROMPT', () => {
  it('é string não vazia', () => {
    expect(BPC_CHECKLIST_SYSTEM_PROMPT.length).toBeGreaterThan(50)
  })

  it('contém palavras-chave', () => {
    expect(BPC_CHECKLIST_SYSTEM_PROMPT).toContain('checklist')
    expect(BPC_CHECKLIST_SYSTEM_PROMPT).toContain('BPC/LOAS')
  })
})

describe('buildChecklistUserPrompt', () => {
  it('gera prompt com dados básicos', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Diabetes',
      cid: 'E11',
      faixaEtaria: 'MAIOR_16',
    })
    expect(prompt).toContain('Diabetes')
    expect(prompt).toContain('E11')
    expect(prompt).toContain('Maior de 16')
  })

  it('gera prompt para menor de 16', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Autismo',
      faixaEtaria: 'MENOR_16',
    })
    expect(prompt).toContain('Menor de 16')
    expect(prompt).toContain('escola')
  })

  it('inclui pré-análise quando fornecida', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      preAnalise: 'Lacunas documentais identificadas',
    })
    expect(prompt).toContain('PRÉ-ANÁLISE DO CASO')
    expect(prompt).toContain('Lacunas documentais')
  })

  it('inclui análise do laudo quando fornecida', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      analiseLaudo: 'Laudo incompleto',
    })
    expect(prompt).toContain('ANÁLISE DO LAUDO MÉDICO')
  })

  it('ignora campos opcionais vazios', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      preAnalise: '',
      analiseLaudo: '  ',
    })
    expect(prompt).not.toContain('PRÉ-ANÁLISE DO CASO')
    expect(prompt).not.toContain('ANÁLISE DO LAUDO MÉDICO')
  })

  it('CID N/A quando não fornecido', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
    })
    expect(prompt).toContain('N/A')
  })

  it('inclui relato social', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      relatoSocial: 'Relato do advogado',
    })
    expect(prompt).toContain('RELATO DA ENTREVISTA SOCIAL')
  })

  it('inclui perguntas médicas', () => {
    const prompt = buildChecklistUserPrompt({
      patologia: 'Teste',
      faixaEtaria: 'MAIOR_16',
      perguntasMedicas: 'Orientações médicas',
    })
    expect(prompt).toContain('ORIENTAÇÕES DA PERÍCIA MÉDICA')
  })
})
