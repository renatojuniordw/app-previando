import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardOpinionLimit } from '@/lib/plan-guard'
import { generateOpinion } from '@/services/opinion-generator'
import { rateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const rows = await prisma.opinion.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    // Mapeia campos do banco (generatedContent/customizedContent) para os nomes
    // esperados pelo frontend (content/editedContent)
    const opinions = rows.map((o) => ({
      id: o.id,
      status: o.status,
      content: o.generatedContent,
      editedContent: o.customizedContent ?? null,
      generationCostUsd: o.generationCostUsd,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }))

    console.log('[opinions GET] caseId=%s count=%d', params.id, opinions.length)
    if (opinions.length > 0) {
      console.log('[opinions GET] primeiro parecer:', {
        id: opinions[0].id,
        status: opinions[0].status,
        contentLength: opinions[0].content?.length ?? 0,
        hasEditedContent: opinions[0].editedContent !== null,
      })
    }

    return NextResponse.json({ opinions })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await guardOpinionLimit(session.user.id, session.user.plan)
    await verifyCaseOwnership(params.id, session.user.id)

    // Rate limit: 20 pareceres/hora por usuário
    const limit = await rateLimit(`ai:${session.user.id}`, 20, 3600)
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Limite de pareceres por hora atingido. Tente mais tarde.' },
        { status: 429 }
      )
    }

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { name: true } },
        cnisDocument: { select: { markdownContent: true } },
        calculations: {
          where: { eligible: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        caseNotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    console.log('[opinions POST] Dados do caso para geração:', {
      caseId: params.id,
      clientName: caso.client?.name,
      benefitType: caso.benefitType,
      caseStatus: caso.status,
      hasCnis: Boolean(caso.cnisDocument?.markdownContent),
      cnisLength: caso.cnisDocument?.markdownContent?.length ?? 0,
      eligibleCalculations: caso.calculations.length,
      notesCount: caso.caseNotes.length,
    })

    const result = await generateOpinion({
      clientName: caso.client?.name ?? 'Cliente',
      benefitType: caso.benefitType,
      caseStatus: caso.status,
      cnisSummary: caso.cnisDocument?.markdownContent ?? undefined,
      calculations: caso.calculations.map((c) => ({
        modalidade: c.modality,
        rmi: c.rmi != null ? String(c.rmi) : '0',
        rma: c.rma != null ? String(c.rma) : '0',
        elegivel: Boolean(c.eligible),
        pendencias: c.pendingIssues,
      })),
      notes: caso.caseNotes.map((n) => ({
        type: n.type,
        content: n.content,
        createdAt: n.createdAt,
      })),
    })

    console.log('[opinions POST] generateOpinion retornou:', {
      contentLength: result.content?.length ?? 0,
      tokensUsed: result.tokensUsed,
      costUsd: result.costUsd,
      model: result.model,
    })

    const opinion = await prisma.opinion.create({
      data: {
        caseId: params.id,
        promptUsed: result.promptUsed,
        generatedContent: result.content,
        model: result.model,
        tokensUsed: result.tokensUsed,
        generationCostUsd: result.costUsd,
        status: 'GENERATED',
      },
    })

    // Incrementa contador
    await prisma.usageRecord.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, opinionsThisMonth: 1 },
      update: { opinionsThisMonth: { increment: 1 } },
    })

    // Registrar log de atividade
    await logAudit({
      userId: session.user.id,
      action: 'opinion.created',
      resource: `Parecer gerado para ${caso.client?.name ?? 'Cliente'}`,
      req,
      metadata: { caseId: params.id, opinionId: opinion.id },
    })

    return NextResponse.json({ opinion }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
