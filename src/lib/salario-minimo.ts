import { prisma } from '@/lib/prisma'

export interface SalarioVigente {
  valor: number
  teto: number
  vigencia: Date
  legislacao: string
}

export async function getSalarioVigente(dib: string): Promise<SalarioVigente> {
  const dibDate = new Date(dib)

  const registro = await prisma.minimumWage.findFirst({
    where: { effectiveDate: { lte: dibDate } },
    orderBy: { effectiveDate: 'desc' },
  })

  if (!registro) {
    throw new Error(
      `Nenhum valor de salário mínimo e teto do RGPS ativo na DIB ${dib} foi encontrado no banco de dados. ` +
      'Por favor, certifique-se de que o seed do banco de dados (npx prisma db seed) foi executado com sucesso.'
    )
  }

  return {
    valor: Number(registro.value),
    teto: Number(registro.ceiling),
    vigencia: registro.effectiveDate,
    legislacao: registro.legislation,
  }
}

