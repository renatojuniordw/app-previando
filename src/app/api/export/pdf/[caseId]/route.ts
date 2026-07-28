import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { guardFeature } from '@/lib/plan-guard'
import { assertClientActive } from '@/lib/ownership'
import { generateCasePDF, type CasePDFData } from '@/lib/pdf-generator'
import { logAudit } from '@/lib/audit'
import type { CnisExtractedData } from '@/services/cnis/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Não autorizado', { status: 401 })
  }

  const { caseId } = await params

  const caso = await prisma.case.findFirst({
    where: { id: caseId, userId: session.user.id },
    include: {
      client: { include: { cnisDocument: true } },
      calculations: { where: { isSelected: true }, take: 1 },
      opinions: { orderBy: { createdAt: 'desc' }, take: 1 },
      user: { select: { name: true, oabNumber: true } },
    },
  })

  if (!caso) {
    return new NextResponse('Caso não encontrado', { status: 404 })
  }

  assertClientActive(caso.client)

  const watermark = session.user.plan === 'FREE'
  if (!watermark) {
    await guardFeature(session.user.plan, 'EXPORT_PDF')
  }

  await logAudit({
    userId: session.user.id,
    action: 'export.pdf',
    resource: `case:${caseId}`,
    req: request,
    metadata: { watermark },
  })

  const selectedCalc = caso.calculations[0]
  const opinion = caso.opinions[0]
  const client = caso.client
  const user = caso.user

  const addressParts = [client.street, client.streetNumber, client.neighborhood, client.city, client.state, client.zipCode].filter(Boolean)
  const address = addressParts.length > 0 ? addressParts.join(', ') : undefined

  const cnisDoc = client.cnisDocument
  const extracted = cnisDoc?.extractedData as CnisExtractedData | null
  const cnisSummary = extracted ? [
    `Contribuições: ${extracted.totalContribuicoes ?? 0}`,
    `Vínculos: ${extracted.periodos?.length ?? 0}`,
    extracted.primeiraContribuicao && `Período: ${extracted.primeiraContribuicao} a ${extracted.ultimaContribuicao ?? ''}`,
  ].filter(Boolean).join(' | ') : undefined

  const pdfData: CasePDFData = {
    clientName: client?.name || '',
    clientCpf: 'XXX.XXX.XXX-XX',
    clientBirthDate: client?.birthDate ? client.birthDate.toISOString().split('T')[0] : '',
    clientMaritalStatus: client?.maritalStatus || undefined,
    clientProfession: client?.profession || undefined,
    clientPhone: client?.phone || undefined,
    clientEmail: client?.email || undefined,
    clientAddress: address,
    selectedCalculation: selectedCalc ? {
      type: selectedCalc.modality || '',
      value: Number(selectedCalc.rmi).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      averageSalary: selectedCalc.benefitSalary
        ? Number(selectedCalc.benefitSalary).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : undefined,
      coefficient: selectedCalc.coefficient != null
        ? `${(Number(selectedCalc.coefficient) * 100).toFixed(2)}%`
        : undefined,
      details: {
        'Tempo de Contribuição': selectedCalc.contributionTime ? `${(selectedCalc.contributionTime / 12).toFixed(1)} anos` : '—',
        'Idade no Cálculo': selectedCalc.ageAtCalculation ? `${selectedCalc.ageAtCalculation} anos` : '—',
      },
      formulaSummary: selectedCalc.calculationMemory
        ? `Fórmula: média dos ${(selectedCalc.calculationMemory as Record<string, unknown>)?.contribuicoesConsideradas ?? 0} maiores salários`
        : undefined,
    } : undefined,
    opinion: opinion?.customizedContent || opinion?.generatedContent || undefined,
    caseStatus: caso.status,
    createdAt: caso.createdAt?.toISOString().split('T')[0],
    cnisSummary,
    lawyerName: user?.name || undefined,
    lawyerOab: user?.oabNumber || undefined,
    watermark,
  }

  const pdfBuffer = await generateCasePDF(pdfData)

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="previando-caso-${caseId}.pdf"`,
    },
  })
}
