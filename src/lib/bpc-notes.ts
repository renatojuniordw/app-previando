import { prisma } from './prisma'
import { NoteType } from '@prisma/client'
import type { RelatoSocial } from '@/types/bpc-social'

const LABELS: Record<string, string> = {
  'pre-analysis': 'Pré-Análise de Viabilidade',
  'laudo': 'Análise de Laudo Médico',
  'social': 'Relato de Avaliação Social',
  'medical': 'Perguntas — Perícia Médica',
  'checklist': 'Checklist de Documentação',
}

export function formatRelatoSocialText(relato: RelatoSocial): string {
  const lines: string[] = ['RELATO DE AVALIAÇÃO SOCIAL — ENTREVISTA COM CLIENTE']

  for (const dominio of relato.dominios) {
    const answered = dominio.itens.filter((i) => i.resposta.trim())
    if (answered.length === 0) continue

    lines.push(`\n${dominio.categoria} — ${dominio.titulo}`)
    for (const item of answered) {
      lines.push(`\nP: ${item.pergunta}`)
      lines.push(`R: ${item.resposta}`)
    }
  }

  const totalRespondidas = relato.dominios.reduce(
    (sum, d) => sum + d.itens.filter((i) => i.resposta.trim()).length, 0
  )
  const totalPerguntas = relato.dominios.reduce((sum, d) => sum + d.itens.length, 0)

  lines.push(`\n\n[${totalRespondidas} de ${totalPerguntas} perguntas respondidas]`)

  return lines.join('\n')
}

export async function saveBpcToNotes(
  caseId: string,
  userId: string,
  tipo: string,
  content: string
): Promise<void> {
  const lastNote = await prisma.caseNote.findFirst({
    where: { caseId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })

  await prisma.caseNote.create({
    data: {
      caseId,
      userId,
      type: NoteType.BPC_ANALYSIS,
      content: `[BPC/LOAS — ${LABELS[tipo] ?? tipo}]\n\n${content}`,
      version: (lastNote?.version ?? 0) + 1,
    },
  }).catch((e) => {
    console.error('[bpc-notes] falha ao salvar no prontuário:', e?.message ?? e)
  })
}
