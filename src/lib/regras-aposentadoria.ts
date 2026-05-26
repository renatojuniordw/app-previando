import { prisma } from '@/lib/prisma'

export interface RegraVigente {
  idadeMinima?: number
  tempoContribuicaoAnos?: number
  pontosMinimos?: number
  carenciaMeses?: number
  descricao: string
  legislacao: string
}

// Chave: `${modalidade}_${genero}` — genero: 'M', 'F' ou 'AMBOS'
export type RegrasVigentes = Record<string, RegraVigente>

export async function getRegrasVigentes(dib: string): Promise<RegrasVigentes> {
  const dibDate = new Date(dib)

  // Busca todas as regras cujas vigências iniciaram antes ou na DIB informada
  const registros = await prisma.regraAposentadoria.findMany({
    where: { vigencia: { lte: dibDate } },
    orderBy: { vigencia: 'desc' },
  })

  const regras: RegrasVigentes = {}

  for (const r of registros) {
    const key = `${r.modalidade}_${r.genero}`
    // Como ordenamos por vigência desc, o primeiro registro encontrado para
    // cada par modalidade+genero é o mais recente e, portanto, o vigente na DIB.
    if (!regras[key]) {
      regras[key] = {
        idadeMinima:           r.idadeMinima           ? Number(r.idadeMinima) : undefined,
        tempoContribuicaoAnos: r.tempoContribuicaoAnos ?? undefined,
        pontosMinimos:         r.pontosMinimos         ?? undefined,
        carenciaMeses:         r.carenciaMeses         ?? undefined,
        descricao:   r.descricao,
        legislacao:  r.legislacao,
      }
    }
  }

  // Se o banco estiver completamente vazio por falta de seed, lançamos um erro informativo de integridade
  if (Object.keys(regras).length === 0) {
    throw new Error(
      `Nenhuma regra de elegibilidade previdenciária ativa na DIB ${dib} foi encontrada no banco de dados. ` +
      'Por favor, certifique-se de que o seed do banco de dados (npx prisma db seed) foi executado com sucesso.'
    )
  }

  return regras
}

