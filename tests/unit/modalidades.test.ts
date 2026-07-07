import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getModalidadesFallback, sortModalidades, getModalidades } from '@/lib/modalidades'
import type { ModalidadeOption } from '@/lib/modalidades'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    modalityLabel: {
      findMany: vi.fn(),
    },
  },
}))

describe('getModalidadesFallback', () => {
  it('deve retornar array de modalidades', () => {
    const mods = getModalidadesFallback()
    expect(Array.isArray(mods)).toBe(true)
    expect(mods.length).toBeGreaterThan(0)
  })

  it('deve retornar todas com ativo true', () => {
    const mods = getModalidadesFallback()
    for (const mod of mods) {
      expect(mod.ativo).toBe(true)
    }
  })

  it('deve ter campos obrigatorios', () => {
    const mods = getModalidadesFallback()
    for (const mod of mods) {
      expect(mod.codigo).toBeDefined()
      expect(mod.label).toBeDefined()
      expect(mod.ativo).toBeDefined()
      expect(mod.ordem).toBeDefined()
    }
  })

  it('deve incluir APOSENTADORIA_IDADE', () => {
    const mods = getModalidadesFallback()
    const idade = mods.find(m => m.codigo === 'APOSENTADORIA_IDADE')
    expect(idade).toBeDefined()
  })

  it('deve incluir BPC_LOAS', () => {
    const mods = getModalidadesFallback()
    const bpc = mods.find(m => m.codigo === 'BPC_LOAS')
    expect(bpc).toBeDefined()
  })
})

describe('getModalidades', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar fallback quando DB falha', async () => {
    vi.mocked(prisma.modalityLabel.findMany).mockRejectedValueOnce(new Error('DB error'))
    const result = await getModalidades()
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].ativo).toBe(true)
  })

  it('deve retornar fallback quando DB retorna array vazio', async () => {
    vi.mocked(prisma.modalityLabel.findMany).mockResolvedValueOnce([])
    const result = await getModalidades()
    expect(result.length).toBeGreaterThan(0)
  })

  it('deve retornar dados do DB quando disponiveis', async () => {
    const mockRecords = [
      { id: '1', code: 'APOSENTADORIA_IDADE', label: 'Aposentadoria por Idade', description: 'desc', active: true, order: 1 },
      { id: '2', code: 'BPC_LOAS', label: 'BPC/LOAS', description: null, active: true, order: 2 },
    ]
    vi.mocked(prisma.modalityLabel.findMany).mockResolvedValueOnce(mockRecords as any)
    const result = await getModalidades()
    expect(result.length).toBe(2)
    expect(result[0].codigo).toBe('APOSENTADORIA_IDADE')
    expect(result[1].codigo).toBe('BPC_LOAS')
  })

  it('deve filtrar inativos por padrao', async () => {
    const mockRecords = [
      { id: '1', code: 'ATIVO', label: 'Ativo', description: null, active: true, order: 1 },
      { id: '2', code: 'INATIVO', label: 'Inativo', description: null, active: false, order: 2 },
    ]
    vi.mocked(prisma.modalityLabel.findMany).mockResolvedValueOnce(mockRecords as any)
    const result = await getModalidades()
    expect(result.length).toBe(1)
    expect(result[0].codigo).toBe('ATIVO')
  })

  it('deve incluir inativos quando includeInactive=true', async () => {
    const mockRecords = [
      { id: '1', code: 'ATIVO', label: 'Ativo', description: null, active: true, order: 1 },
      { id: '2', code: 'INATIVO', label: 'Inativo', description: null, active: false, order: 2 },
    ]
    vi.mocked(prisma.modalityLabel.findMany).mockResolvedValueOnce(mockRecords as any)
    const result = await getModalidades({ includeInactive: true })
    expect(result.length).toBe(2)
  })
})

describe('sortModalidades', () => {
  it('deve ordenar por ordem primeiro', () => {
    const a: ModalidadeOption = { codigo: 'B', label: 'Beta', ativo: true, ordem: 2 }
    const b: ModalidadeOption = { codigo: 'A', label: 'Alpha', ativo: true, ordem: 1 }
    const arr = [a, b]
    arr.sort(sortModalidades)
    expect(arr[0].codigo).toBe('A')
  })

  it('deve ordenar por label quando ordem igual', () => {
    const a: ModalidadeOption = { codigo: 'A', label: 'Zebra', ativo: true, ordem: 1 }
    const b: ModalidadeOption = { codigo: 'B', label: 'Alpha', ativo: true, ordem: 1 }
    const arr = [a, b]
    arr.sort(sortModalidades)
    expect(arr[0].label).toBe('Alpha')
  })

  it('deve usar locale pt-BR para comparacao de labels', () => {
    const a: ModalidadeOption = { codigo: 'A', label: 'Aposentadoria', ativo: true, ordem: 1 }
    const b: ModalidadeOption = { codigo: 'B', label: 'Auxílio', ativo: true, ordem: 1 }
    const arr = [a, b]
    arr.sort(sortModalidades)
    expect(arr[0].label).toBe('Aposentadoria')
  })
})
