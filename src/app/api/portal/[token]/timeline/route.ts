import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const access = await prisma.clientAccess.findUnique({
      where: { token: params.token },
      include: {
        case: {
          include: {
            caseNotes: {
              orderBy: { createdAt: 'desc' },
              take: 20,
              select: { id: true, type: true, content: true, createdAt: true },
            },
            calculations: {
              where: { isSelected: true },
              orderBy: { createdAt: 'desc' },
              select: { id: true, modality: true, rmi: true, eligible: true, createdAt: true },
            },
            retroactives: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, createdAt: true },
            },
            opinions: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { id: true, createdAt: true },
            },
            bpcAnalysis: {
              select: { id: true, createdAt: true, updatedAt: true },
            },
            checklists: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { id: true, createdAt: true },
            },
            documents: {
              orderBy: { createdAt: 'desc' },
              take: 20,
              select: { id: true, fileName: true, createdAt: true },
            },
          },
        },
      },
    })

    if (!access || access.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Acesso não encontrado ou expirado.' }, { status: 404 })
    }

    const c = (access as unknown as { case: typeof access.case }).case
    const events: Array<{
      id: string
      type: string
      category: string
      title: string
      description: string
      date: Date
    }> = []

    events.push({
      id: `case-created-${c.createdAt.toISOString()}`,
      type: 'CASE_CREATED',
      category: 'case',
      title: 'Caso cadastrado',
      description: 'Seu caso foi cadastrado em nosso sistema.',
      date: c.createdAt,
    })

    for (const note of c.caseNotes) {
      events.push({
        id: `note-${note.id}`,
        type: 'NOTE_ADDED',
        category: 'note',
        title: 'Anotação no prontuário',
        description: note.content.replace(/Chave de armazenamento:.*/, '').trim().slice(0, 120) || 'Anotação registrada',
        date: note.createdAt,
      })
    }

    for (const calc of c.calculations) {
      events.push({
        id: `calc-${calc.id}`,
        type: 'CALCULATION_CREATED',
        category: 'calculation',
        title: 'Cálculo realizado',
        description: calc.eligible
          ? `${calc.modality} — RMI calculado`
          : `${calc.modality} — Não elegível`,
        date: calc.createdAt,
      })
    }

    for (const retro of c.retroactives) {
      events.push({
        id: `retro-${retro.id}`,
        type: 'RETROACTIVE_CALCULATED',
        category: 'retroactive',
        title: 'Retroativo calculado',
        description: 'Valores retroativos foram calculados.',
        date: retro.createdAt,
      })
    }

    for (const opinion of c.opinions) {
      events.push({
        id: `opinion-${opinion.id}`,
        type: 'OPINION_CREATED',
        category: 'opinion',
        title: 'Parecer jurídico gerado',
        description: 'Um parecer jurídico foi gerado para o seu caso.',
        date: opinion.createdAt,
      })
    }

    if (c.bpcAnalysis) {
      const bpcDate = c.bpcAnalysis.updatedAt || c.bpcAnalysis.createdAt
      if (bpcDate) {
        events.push({
          id: `bpc-${c.bpcAnalysis.id}`,
          type: 'BPC_ANALYSIS',
          category: 'bpc',
          title: 'Análise BPC/LOAS realizada',
          description: 'A análise socioeconômica do BPC foi concluída.',
          date: bpcDate,
        })
      }
    }

    for (const cl of c.checklists) {
      events.push({
        id: `checklist-${cl.id}`,
        type: 'CHECKLIST_UPDATED',
        category: 'checklist',
        title: 'Checklist atualizado',
        description: 'O checklist de documentos foi atualizado.',
        date: cl.createdAt,
      })
    }

    for (const doc of c.documents) {
      events.push({
        id: `doc-${doc.id}`,
        type: 'DOCUMENT_ADDED',
        category: 'document',
        title: 'Documento adicionado',
        description: doc.fileName,
        date: doc.createdAt,
      })
    }

    events.sort((a, b) => b.date.getTime() - a.date.getTime())

    return NextResponse.json({ events })
  } catch (err) {
    return handleApiError(err)
  }
}
