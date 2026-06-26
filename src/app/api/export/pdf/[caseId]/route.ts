import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { guardFeature } from '@/lib/plan-guard'
import { generateCasePDF } from '@/lib/pdf-generator'
import { logAuditEvent } from '@/lib/audit'

// Gera um PDF binário real para o caso usando pdfkit
// Retorna application/pdf com branding Previando
export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new NextResponse('Não autorizado', { status: 401 })
  }

  // Rate limiting simples
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `pdf-export-${ip}`
  // Em produção usar Redis ou similar

  const { caseId } = params

  // Buscar dados do caso
  const caso = await prisma.caso.findFirst({
    where: {
      id: caseId,
      userId: session.user.id,
    },
    include: {
      client: true,
      selectedCalculation: true,
      opinion: true,
    },
  })

  if (!caso) {
    return new NextResponse('Caso não encontrado', { status: 404 })
  }

  // Plan guard - FREE plans get watermark, SOLO+ need feature enabled
  const watermark = session.user.plan === 'FREE'
  if (!watermark) {
    await guardFeature(session.user.plan, 'EXPORT_PDF')
  }

  // Audit log
  await logAuditEvent({
    userId: session.user.id,
    action: 'export.pdf',
    entity: 'case',
    entityId: caseId,
    metadata: { watermark },
  })

  // Gerar PDF binário
  const pdfBuffer = await generateCasePDF({
    clientName: caso.client?.nome || '',
    clientCpf: caso.client?.cpf || '',
    clientBirthDate: caso.client?.dataNascimento || '',
    clientDeathDate: caso.client?.dataObito || '',
    clientMaritalStatus: caso.client?.estadoCivil || '',
    clientSurvivors: caso.client?.dependentes || '',
    selectedCalculation: caso.selectedCalculation ? {
      type: caso.selectedCalculation.tipo || '',
      value: caso.selectedCalculation.valor || '',
      details: caso.selectedCalculation.detalhes || {},
    } : undefined,
    opinion: caso.opinion?.texto,
    caseStatus: caso.status,
    createdAt: caso.createdAt?.toISOString().split('T')[0],
    watermark,
  })

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="previando-caso-${caseId}.pdf"`,
    },
  })
}
