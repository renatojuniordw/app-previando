import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    caseNote: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { formatRelatoSocialText, saveBpcToNotes } from '@/lib/bpc-notes'
import { prisma } from '@/lib/prisma'
import type { RelatoSocial } from '@/types/bpc-social'

describe('formatRelatoSocialText', () => {
  it('formats relato with domain and answered items', () => {
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

  it('skips domain with no answers', () => {
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

  it('formats multiple domains', () => {
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

  it('handles empty relato', () => {
    const relato: RelatoSocial = { dominios: [] }
    const text = formatRelatoSocialText(relato)
    expect(text).toContain('RELATO DE AVALIAÇÃO SOCIAL')
    expect(text).toContain('[0 de 0 perguntas respondidas]')
  })

  it('filters whitespace-only answers', () => {
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

describe('saveBpcToNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates first note with version 1 when no prior notes exist', async () => {
    vi.mocked(prisma.caseNote.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.caseNote.create).mockResolvedValue({} as any)

    await saveBpcToNotes('case-1', 'user-1', 'pre-analysis', 'Conteúdo da análise')

    expect(prisma.caseNote.findFirst).toHaveBeenCalledWith({
      where: { caseId: 'case-1' },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    expect(prisma.caseNote.create).toHaveBeenCalledWith({
      data: {
        caseId: 'case-1',
        userId: 'user-1',
        type: 'BPC_ANALYSIS',
        content: '[BPC/LOAS — Pré-Análise de Viabilidade]\n\nConteúdo da análise',
        version: 1,
      },
    })
  })

  it('increments version when prior notes exist', async () => {
    vi.mocked(prisma.caseNote.findFirst).mockResolvedValue({ version: 3 })
    vi.mocked(prisma.caseNote.create).mockResolvedValue({} as any)

    await saveBpcToNotes('case-1', 'user-1', 'laudo', 'Laudo médico')

    expect(prisma.caseNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 4 }),
      })
    )
  })

  it('uses raw tipo when not found in LABELS mapping', async () => {
    vi.mocked(prisma.caseNote.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.caseNote.create).mockResolvedValue({} as any)

    await saveBpcToNotes('case-1', 'user-1', 'unknown_type', 'Test')

    expect(prisma.caseNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        content: '[BPC/LOAS — unknown_type]\n\nTest',
      }),
    })
  })

  it('uses all known label mappings', async () => {
    const labels: Record<string, string> = {
      'pre-analysis': 'Pré-Análise de Viabilidade',
      'laudo': 'Análise de Laudo Médico',
      'social': 'Relato de Avaliação Social',
      'medical': 'Perguntas — Perícia Médica',
      'checklist': 'Checklist de Documentação',
    }

    for (const [tipo, expected] of Object.entries(labels)) {
      vi.mocked(prisma.caseNote.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.caseNote.create).mockResolvedValue({} as any)

      await saveBpcToNotes('case-1', 'user-1', tipo, 'Content')

      expect(prisma.caseNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: `[BPC/LOAS — ${expected}]\n\nContent`,
          }),
        })
      )
    }
  })

  it('does not throw when prisma create fails', async () => {
    vi.mocked(prisma.caseNote.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.caseNote.create).mockRejectedValue(new Error('DB error'))

    await expect(saveBpcToNotes('case-1', 'user-1', 'social', 'Content')).resolves.toBeUndefined()
  })
})
