import { prisma } from './prisma'
import { NoteType } from '@prisma/client'

const LABELS: Record<string, string> = {
  'pre-analysis': 'Pré-Análise de Viabilidade',
  'laudo': 'Análise de Laudo Médico',
  'social': 'Perguntas — Avaliação Social',
  'medical': 'Perguntas — Perícia Médica',
  'checklist': 'Checklist de Documentação',
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
  }).catch(() => {
    // Não propaga: salvar no prontuário é não-crítico
  })
}
