import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { guardFeature } from '@/lib/plan-guard'
import { generateCasePDF } from '@/lib/pdf-generator'
import { logAudit } from '@/lib/audit'

// Gera um PDF binário real para o caso usando pdfkit
// Retorna application/pdf com branding Previando
export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Não autorizado', { status: 401 })
  }

  const { caseId } = await params

  // Buscar dados do caso
  const caso = await prisma.case.findFirst({
    where: {
      id: caseId,
      userId: session.user.id,
    },
    include: {
      client: true,
      calculations: {
        where: {
          isSelected: true,
        },
        take: 1,
      },
      opinions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
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
  await logAudit({
    userId: session.user.id,
    action: 'export.pdf',
    resource: `case:${caseId}`,
    req: request,
    metadata: { watermark },
  })

  const selectedCalc = caso.calculations[0]
  const opinion = caso.opinions[0]

  // Gerar PDF binário
  const pdfBuffer = await generateCasePDF({
    clientName: caso.client?.name || '',
    clientCpf: '',
    clientBirthDate: caso.client?.birthDate ? caso.client.birthDate.toISOString().split('T')[0] : '',
    clientDeathDate: '',
    clientMaritalStatus: '',
    clientSurvivors: '',
    selectedCalculation: selectedCalc ? {
      type: selectedCalc.modality || '',
      value: selectedCalc.rmi ? Number(selectedCalc.rmi).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—',
      details: {
        'Tempo de Contribuição': selectedCalc.contributionTime ? `${(selectedCalc.contributionTime / 12).toFixed(1)} anos` : '—',
        'Idade no Cálculo': selectedCalc.ageAtCalculation ? `${selectedCalc.ageAtCalculation} anos` : '—',
      },
    } : undefined,
    opinion: opinion?.customizedContent || opinion?.generatedContent || undefined,
    caseStatus: caso.status,
    createdAt: caso.createdAt?.toISOString().split('T')[0],
    watermark,
  })

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="previando-caso-${caseId}.pdf"`,
    },
  })
}
