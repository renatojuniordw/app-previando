import { describe, it, expect, vi } from 'vitest'
import {
  verifyCaseOwnership,
  verifyClientOwnership,
  assertClientActive,
  verifyClientOwnershipAndActive,
  verifyCaseOwnershipAndActive,
} from '@/lib/ownership'
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

describe('assertClientActive', () => {
  it('deve passar quando cliente esta ativo', () => {
    expect(() => assertClientActive({ active: true })).not.toThrow()
  })

  it('deve lancar PlanLimitError quando cliente esta inativo', () => {
    expect(() => assertClientActive({ active: false })).toThrow(
      'Este cliente está bloqueado por exceder o limite'
    )
  })
})

describe('verifyClientOwnershipAndActive', () => {
  it('deve passar quando cliente pertence ao usuario e esta ativo', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: 'client-1', active: true } as any)
    await expect(verifyClientOwnershipAndActive('client-1', 'user-1')).resolves.toBeUndefined()
  })

  it('deve lancar NotFoundError quando cliente nao existe', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as any)
    await expect(verifyClientOwnershipAndActive('client-1', 'user-1')).rejects.toThrow(
      'Recurso não encontrado'
    )
  })

  it('deve lancar PlanLimitError quando cliente esta inativo', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: 'client-1', active: false } as any)
    await expect(verifyClientOwnershipAndActive('client-1', 'user-1')).rejects.toThrow(
      'Este cliente está bloqueado por exceder o limite'
    )
  })

  it('deve buscar com select de id e active', async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: 'client-1', active: true } as any)
    await verifyClientOwnershipAndActive('client-1', 'user-1')
    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', userId: 'user-1' },
      select: { id: true, active: true },
    })
  })
})

describe('verifyCaseOwnershipAndActive', () => {
  it('deve passar quando caso pertence ao usuario e cliente esta ativo', async () => {
    vi.mocked(prisma.case.findFirst).mockResolvedValueOnce({
      id: 'case-1',
      client: { active: true },
    } as any)
    await expect(verifyCaseOwnershipAndActive('case-1', 'user-1')).resolves.toBeUndefined()
  })

  it('deve lancar NotFoundError quando caso nao existe', async () => {
    vi.mocked(prisma.case.findFirst).mockResolvedValueOnce(null as any)
    await expect(verifyCaseOwnershipAndActive('case-1', 'user-1')).rejects.toThrow(
      'Recurso não encontrado'
    )
  })

  it('deve lancar PlanLimitError quando cliente do caso esta inativo', async () => {
    vi.mocked(prisma.case.findFirst).mockResolvedValueOnce({
      id: 'case-1',
      client: { active: false },
    } as any)
    await expect(verifyCaseOwnershipAndActive('case-1', 'user-1')).rejects.toThrow(
      'Este cliente está bloqueado por exceder o limite'
    )
  })

  it('deve buscar com select de id e client.active', async () => {
    vi.mocked(prisma.case.findFirst).mockResolvedValueOnce({
      id: 'case-1',
      client: { active: true },
    } as any)
    await verifyCaseOwnershipAndActive('case-1', 'user-1')
    expect(prisma.case.findFirst).toHaveBeenCalledWith({
      where: { id: 'case-1', userId: 'user-1' },
      select: { id: true, client: { select: { active: true } } },
    })
  })
})
