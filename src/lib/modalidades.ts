import { prisma } from '@/lib/prisma'
import { MODALIDADES_PADRAO, MODALIDADE_LABELS } from '@/lib/modalidade-labels'

export interface ModalidadeOption {
  id?: string
  codigo: string
  label: string
  descricao?: string | null
  ativo: boolean
  ordem: number
}

interface GetModalidadesOptions {
  includeInactive?: boolean
}

function sortModalidades(a: ModalidadeOption, b: ModalidadeOption) {
  if (a.ordem !== b.ordem) return a.ordem - b.ordem
  return a.label.localeCompare(b.label, 'pt-BR')
}

export function getModalidadesFallback(): ModalidadeOption[] {
  return MODALIDADES_PADRAO.map((item) => ({
    ...item,
    descricao: item.descricao ?? null,
    ativo: true,
  }))
}

export async function getModalidades(options: GetModalidadesOptions = {}): Promise<ModalidadeOption[]> {
  let registros: Awaited<ReturnType<typeof prisma.modalityLabel.findMany>> = []
  try {
    registros = await prisma.modalityLabel.findMany({
      where: options.includeInactive ? undefined : { active: true },
      orderBy: [{ order: 'asc' }, { label: 'asc' }],
    })
  } catch {
    return getModalidadesFallback()
  }

  if (registros.length === 0) {
    return getModalidadesFallback()
  }

  return registros
    .map((registro) => ({
      id: registro.id,
      codigo: registro.code,
      label: registro.label,
      descricao: registro.description,
      ativo: registro.active,
      ordem: registro.order,
    }))
    .filter((item) => options.includeInactive || item.ativo)
    .sort(sortModalidades)
}

export async function getModalidadeLabelMap(options: GetModalidadesOptions = {}): Promise<Record<string, string>> {
  const modalidades = await getModalidades(options)

  if (modalidades.length === 0) {
    return MODALIDADE_LABELS
  }

  return Object.fromEntries(modalidades.map(({ codigo, label }) => [codigo, label]))
}
