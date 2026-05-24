import { prisma } from '@/lib/prisma'

export interface SalarioVigente {
  valor: number
  teto: number
  vigencia: Date
  legislacao: string
}

// Fallback caso o banco não tenha dados (nunca deveria acontecer após seed)
const FALLBACK: SalarioVigente = {
  valor: 1621.0,
  teto: 8157.41,
  vigencia: new Date('2026-01-01'),
  legislacao: 'Decreto 12.797/2025',
}

export async function getSalarioVigente(dib: string): Promise<SalarioVigente> {
  const dibDate = new Date(dib)

  const registro = await prisma.salarioMinimo.findFirst({
    where: { vigencia: { lte: dibDate } },
    orderBy: { vigencia: 'desc' },
  })

  if (!registro) return FALLBACK

  return {
    valor: Number(registro.valor),
    teto: Number(registro.teto),
    vigencia: registro.vigencia,
    legislacao: registro.legislacao,
  }
}
