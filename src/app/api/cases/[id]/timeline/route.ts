import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

const NOTE_TYPE_LABELS: Record<string, string> = {
  CONTACT: 'Contato',
  DOCUMENT: 'Documento',
  LEGAL: 'Jurídico',
  INTERNAL: 'Interno',
  CALCULATION: 'Cálculo',
  PENDING_ISSUE: 'Pendência',
  BPC_ANALYSIS: 'Análise BPC',
}

const MODALITY_LABELS: Record<string, string> = {
  POINTS_86_96: 'Pontos (86/96)',
  TOLL_50: 'Pedágio 50%',
  TOLL_100: 'Pedágio 100%',
  MINIMUM_AGE_65_62: 'Idade Mínima 65/62',
  CONTRIBUTION_TIME: 'Tempo de Contribuição',
  RETIREMENT_BY_AGE: 'Aposentadoria por Idade',
  SPECIAL_RETIREMENT: 'Aposentadoria Especial',
  HYBRID: 'Aposentadoria Híbrida',
  SICKNESS_BENEFIT_B31: 'Auxílio-Doença B31',
  SICKNESS_BENEFIT_B91: 'Auxílio-Doença B91',
  MATERNITY_PAY: 'Salário-Maternidade',
  PRISONER_BENEFIT: 'Auxílio-Reclusão',
  DEATH_PENSION: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      select: {
        createdAt: true,
        status: true,
        benefitType: true,
        caseNotes: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, type: true, content: true, createdAt: true, version: true },
        },
        calculations: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, modality: true, rmi: true, eligible: true, createdAt: true, isSelected: true },
        },
        opinions: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, createdAt: true },
        },
        checklists: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, eligible: true, createdAt: true },
        },
        simulations: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, scenarioName: true, rmiProjected: true, createdAt: true },
        },
        retroactives: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, totalCorrectedValue: true, createdAt: true },
        },
        client: {
          select: {
            cnisDocument: {
              select: { createdAt: true, processingStatus: true, fileName: true },
            },
          },
        },
      },
    })

    type TimelineEvent = {
      id: string
      type: string
      category: string
      title: string
      description: string
      date: Date
      meta?: Record<string, unknown>
    }

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })
    }

    const events: TimelineEvent[] = []

    events.push({
      id: 'case-created',
      type: 'CASE_CREATED',
      category: 'case',
      title: 'Caso criado',
      description: 'Caso registrado no sistema',
      date: caso.createdAt,
    })

    if (caso.client.cnisDocument) {
      events.push({
        id: 'cnis-upload',
        type: 'CNIS_UPLOAD',
        category: 'cnis',
        title: 'CNIS enviado',
        description: caso.client.cnisDocument.fileName,
        date: caso.client.cnisDocument.createdAt,
        meta: { status: caso.client.cnisDocument.processingStatus },
      })
    }

    for (const note of caso.caseNotes) {
      events.push({
        id: `note-${note.id}`,
        type: 'NOTE',
        category: 'note',
        title: `Anotação: ${NOTE_TYPE_LABELS[note.type] ?? note.type}`,
        description: note.content.slice(0, 120) + (note.content.length > 120 ? '…' : ''),
        date: note.createdAt,
        meta: { version: note.version },
      })
    }

    for (const calc of caso.calculations) {
      const rmi = Number(calc.rmi).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      events.push({
        id: `calc-${calc.id}`,
        type: 'CALCULATION',
        category: 'calculation',
        title: `Cálculo: ${MODALITY_LABELS[calc.modality] ?? calc.modality}`,
        description: `RMI: ${rmi} — ${calc.eligible ? 'Elegível' : 'Não elegível'}${calc.isSelected ? ' ✓ Selecionado' : ''}`,
        date: calc.createdAt,
        meta: { eligible: calc.eligible, isSelected: calc.isSelected },
      })
    }

    for (const op of caso.opinions) {
      events.push({
        id: `opinion-${op.id}`,
        type: 'OPINION',
        category: 'opinion',
        title: 'Parecer gerado',
        description: `Status: ${op.status === 'GENERATED' ? 'Gerado' : op.status === 'REVIEWED' ? 'Revisado' : 'Finalizado'}`,
        date: op.createdAt,
      })
    }

    for (const ck of caso.checklists) {
      events.push({
        id: `checklist-${ck.id}`,
        type: 'CHECKLIST',
        category: 'checklist',
        title: 'Checklist realizado',
        description: ck.eligible ? 'Documentação completa' : 'Pendências identificadas',
        date: ck.createdAt,
        meta: { eligible: ck.eligible },
      })
    }

    for (const sim of caso.simulations) {
      const rmi = Number(sim.rmiProjected).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      events.push({
        id: `sim-${sim.id}`,
        type: 'SIMULATION',
        category: 'simulation',
        title: `Simulação: ${sim.scenarioName}`,
        description: `RMI projetado: ${rmi}`,
        date: sim.createdAt,
      })
    }

    for (const ret of caso.retroactives) {
      const val = Number(ret.totalCorrectedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      events.push({
        id: `retro-${ret.id}`,
        type: 'RETROACTIVE',
        category: 'retroactive',
        title: 'Cálculo de retroativos',
        description: `Total corrigido: ${val}`,
        date: ret.createdAt,
      })
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ events })
  } catch (err) {
    return handleApiError(err)
  }
}
