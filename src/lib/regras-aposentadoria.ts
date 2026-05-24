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

// Fallback hardcoded — usado apenas se o banco não tiver dados
const FALLBACK: RegrasVigentes = {
  APOSENTADORIA_IDADE_M:    { idadeMinima: 65, tempoContribuicaoAnos: 20, carenciaMeses: 180, descricao: 'Aposent. por Idade - Homens',    legislacao: 'EC 103/2019' },
  APOSENTADORIA_IDADE_F:    { idadeMinima: 62, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Aposent. por Idade - Mulheres',   legislacao: 'EC 103/2019' },
  IDADE_MINIMA_65_62_M:     { idadeMinima: 65, tempoContribuicaoAnos: 20, carenciaMeses: 180, descricao: 'Regra Permanente - Homens',       legislacao: 'EC 103/2019' },
  IDADE_MINIMA_65_62_F:     { idadeMinima: 62, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Regra Permanente - Mulheres',     legislacao: 'EC 103/2019' },
  TEMPO_CONTRIBUICAO_M:     { tempoContribuicaoAnos: 35, carenciaMeses: 180, descricao: 'Tempo de Contribuição - Homens',                   legislacao: 'EC 103/2019' },
  TEMPO_CONTRIBUICAO_F:     { tempoContribuicaoAnos: 30, carenciaMeses: 180, descricao: 'Tempo de Contribuição - Mulheres',                 legislacao: 'EC 103/2019' },
  PONTOS_86_96_M:           { pontosMinimos: 103, tempoContribuicaoAnos: 35, carenciaMeses: 180, descricao: 'Por Pontos - Homens',          legislacao: 'EC 103/2019' },
  PONTOS_86_96_F:           { pontosMinimos: 93,  tempoContribuicaoAnos: 30, carenciaMeses: 180, descricao: 'Por Pontos - Mulheres',        legislacao: 'EC 103/2019' },
  PEDAGIO_50_M:             { tempoContribuicaoAnos: 35, carenciaMeses: 180, descricao: 'Pedágio 50% - Homens',                             legislacao: 'EC 103/2019' },
  PEDAGIO_50_F:             { tempoContribuicaoAnos: 30, carenciaMeses: 180, descricao: 'Pedágio 50% - Mulheres',                           legislacao: 'EC 103/2019' },
  PEDAGIO_100_M:            { idadeMinima: 60, tempoContribuicaoAnos: 35, carenciaMeses: 180, descricao: 'Pedágio 100% - Homens',           legislacao: 'EC 103/2019' },
  PEDAGIO_100_F:            { idadeMinima: 57, tempoContribuicaoAnos: 30, carenciaMeses: 180, descricao: 'Pedágio 100% - Mulheres',         legislacao: 'EC 103/2019' },
  APOSENTADORIA_ESPECIAL_AMBOS: { idadeMinima: 60, tempoContribuicaoAnos: 25, descricao: 'Aposentadoria Especial',                          legislacao: 'EC 103/2019' },
  HIBRIDA_M:                { idadeMinima: 65, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Aposentadoria Híbrida - Homens',  legislacao: 'EC 103/2019' },
  HIBRIDA_F:                { idadeMinima: 62, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Aposentadoria Híbrida - Mulheres',legislacao: 'EC 103/2019' },
  BPC_LOAS_AMBOS:           { idadeMinima: 65, descricao: 'BPC/LOAS - Idoso',                                                              legislacao: 'Lei 8.742/1993' },
  AUXILIO_DOENCA_B31_AMBOS: { carenciaMeses: 12, descricao: 'Auxílio-Doença Previdenciário',                                               legislacao: 'Lei 8.213/1991' },
  PENSAO_MORTE_AMBOS:       { carenciaMeses: 18, descricao: 'Pensão por Morte',                                                            legislacao: 'EC 103/2019' },
}

export async function getRegrasVigentes(dib: string): Promise<RegrasVigentes> {
  const dibDate = new Date(dib)

  const registros = await prisma.regraAposentadoria.findMany({
    where: { vigencia: { lte: dibDate } },
    orderBy: { vigencia: 'desc' },
  })

  const regras: RegrasVigentes = {}

  for (const r of registros) {
    const key = `${r.modalidade}_${r.genero}`
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

  // Preenche chaves ausentes com fallback
  for (const [key, fallback] of Object.entries(FALLBACK)) {
    if (!regras[key]) regras[key] = fallback
  }

  return regras
}
