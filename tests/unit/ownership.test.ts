import { describe, it, expect, vi } from 'vitest'
import { verifyCaseOwnership, verifyClientOwnership } from '@/lib/ownership'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    case: { findFirst: vi.fn() },
    client: { findFirst: vi.fn() },
  },
}))

describe('verifyCaseOwnership', () => {
  it('deve passar quando o case pertence ao usuario', async () => {
    vi.mocked(prisma.case.findFirst).mockResolvedValueOnce({ id: 'case-1' } as any)
    await expect(verifyCaseOwnership('case-1', 'user-1')).resolves.toBeUndefined()
  })

  it('deve lancar NotFoundError quando o case nao pertence ao usuario', async () => {
    vi.mocked(prisma.case.findFirst).mockResolvedValueOnce(null as any)
    await expect(verifyCaseOwnership('case-1', 'user-2')).rejects.toThrow('Recurso não encontrado')
  })

  it('deve buscar com caseId e userId corretos', async () => {
    vi.mocked(prisma.case.findFirst).mockResolvedValueOnce({ id: 'case-1' } as any)
    await verifyCaseOwnership('case-1', 'user-1')
    expect(prisma.case.findFirst).toHaveBeenCalledWith({
      where: { id: 'case-1', userId: 'user-1' },
      select: { id: true },
    })
  })
})

describe('verifyClientOwnership', () => {
  it('deve passar quando o client pertence ao usuario', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: 'client-1' } as any)
    await expect(verifyClientOwnership('client-1', 'user-1')).resolves.toBeUndefined()
  })

  it('deve lancar NotFoundError quando o client nao pertence ao usuario', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as any)
    await expect(verifyClientOwnership('client-1', 'user-2')).rejects.toThrow('Recurso não encontrado')
  })
})
