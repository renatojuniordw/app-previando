import { describe, it, expect } from 'vitest'
import { formatRelatoSocialText } from '@/lib/bpc-notes'
import type { RelatoSocial } from '@/types/bpc-social'

describe('formatRelatoSocialText', () => {
  it('deve formatar relato com dominio e itens respondidos', () => {
    const relato: RelatoSocial = {
      dominios: [
        {
          id: 'd1',
          categoria: 'SAUDE',
          titulo: 'Saúde e Capacidade Funcional',
          aspectosRelevantes: '',
          lacunas: '',
          itens: [
            { pergunta: 'Qual sua principal dificuldade?', resposta: 'Dificuldade para caminhar' },
            { pergunta: 'Usa algum auxilio?', resposta: '' },
          ],
        },
      ],
    }

    const text = formatRelatoSocialText(relato)
    expect(text).toContain('RELATO DE AVALIAÇÃO SOCIAL')
    expect(text).toContain('SAUDE — Saúde e Capacidade Funcional')
    expect(text).toContain('P: Qual sua principal dificuldade?')
    expect(text).toContain('R: Dificuldade para caminhar')
    expect(text).toContain('[1 de 2 perguntas respondidas]')
  })

  it('deve ignorar dominio sem respostas', () => {
    const relato: RelatoSocial = {
      dominios: [
        {
          id: 'd1',
          categoria: 'VAZIO',
          titulo: 'Domínio Vazio',
          aspectosRelevantes: '',
          lacunas: '',
          itens: [
            { pergunta: 'Pergunta 1', resposta: '' },
            { pergunta: 'Pergunta 2', resposta: '   ' },
          ],
        },
        {
          id: 'd2',
          categoria: 'SAUDE',
          titulo: 'Saúde',
          aspectosRelevantes: '',
          lacunas: '',
          itens: [
            { pergunta: 'Tem dor?', resposta: 'Sim' },
          ],
        },
      ],
    }

    const text = formatRelatoSocialText(relato)
    expect(text).not.toContain('VAZIO')
    expect(text).toContain('SAUDE — Saúde')
    expect(text).toContain('[1 de 3 perguntas respondidas]')
  })

  it('deve formatar multiple dominios', () => {
    const relato: RelatoSocial = {
      dominios: [
        {
          id: 'd1',
          categoria: 'SAUDE',
          titulo: 'Saúde',
          aspectosRelevantes: '',
          lacunas: '',
          itens: [
            { pergunta: 'P1', resposta: 'R1' },
            { pergunta: 'P2', resposta: 'R2' },
          ],
        },
        {
          id: 'd2',
          categoria: 'TRABALHO',
          titulo: 'Trabalho',
          aspectosRelevantes: '',
          lacunas: '',
          itens: [
            { pergunta: 'P3', resposta: 'R3' },
          ],
        },
      ],
    }

    const text = formatRelatoSocialText(relato)
    expect(text).toContain('SAUDE — Saúde')
    expect(text).toContain('TRABALHO — Trabalho')
    expect(text).toContain('[3 de 3 perguntas respondidas]')
  })

  it('deve lidar com relato vazio', () => {
    const relato: RelatoSocial = { dominios: [] }
    const text = formatRelatoSocialText(relato)
    expect(text).toContain('RELATO DE AVALIAÇÃO SOCIAL')
    expect(text).toContain('[0 de 0 perguntas respondidas]')
  })

  it('deve filtrar respostas com apenas espacos', () => {
    const relato: RelatoSocial = {
      dominios: [
        {
          id: 'd1',
          categoria: 'TESTE',
          titulo: 'Teste',
          aspectosRelevantes: '',
          lacunas: '',
          itens: [
            { pergunta: 'P1', resposta: '   ' },
            { pergunta: 'P2', resposta: 'resposta válida' },
          ],
        },
      ],
    }

    const text = formatRelatoSocialText(relato)
    expect(text).toContain('P2')
    expect(text).not.toContain('P1')
    expect(text).toContain('[1 de 2 perguntas respondidas]')
  })
})
