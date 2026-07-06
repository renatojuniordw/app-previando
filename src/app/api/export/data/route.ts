import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

/**
 * GET /api/export/data
 *
 * Exporta todos os dados do escritório em formato JSON.
 * Não inclui dados sensíveis (CPF hash, senhas).
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const userId = session.user.id

    const [user, clients, cases, payments, usageRecord] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          oabNumber: true,
          phone: true,
          plan: true,
          planStatus: true,
          createdAt: true,
          firstLoginAt: true,
        },
      }),

      prisma.client.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          birthDate: true,
          phone: true,
          email: true,
          priority: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      }),

      prisma.case.findMany({
        where: { userId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              cnisDocument: {
                select: {
                  fileName: true,
                  fileSizeBytes: true,
                  processingStatus: true,
                  nit: true,
                  totalContributions: true,
                  firstContribution: true,
                  lastContribution: true,
                  createdAt: true,
                },
              },
            },
          },
          calculations: {
            select: {
              modality: true,
              isSelected: true,
              rmi: true,
              rma: true,
              benefitSalary: true,
              socialSecurityFactor: true,
              coefficient: true,
              expectedDib: true,
              gracePeriodMet: true,
              contributionTime: true,
              ageAtCalculation: true,
              eligible: true,
              pendingIssues: true,
              createdAt: true,
            },
          },
          retroactives: {
            select: {
              entitlementStartDate: true,
              requestDate: true,
              monthsLate: true,
              monthlyGrossValue: true,
              totalGrossValue: true,
              totalCorrectedValue: true,
              correctionIndex: true,
              discountValue: true,
              discountDescription: true,
              finalNetValue: true,
              createdAt: true,
            },
          },
          opinions: {
            select: {
              generatedContent: true,
              customizedContent: true,
              status: true,
              createdAt: true,
            },
          },
          caseNotes: {
            select: {
              type: true,
              content: true,
              version: true,
              createdAt: true,
            },
            orderBy: { version: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.payment.findMany({
        where: { userId },
        select: {
          mpPaymentId: true,
          plan: true,
          amount: true,
          currency: true,
          status: true,
          paidAt: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.usageRecord.findUnique({
        where: { userId },
        select: {
          totalClients: true,
          calculationsThisMonth: true,
          opinionsThisMonth: true,
          bpcAnalysesThisMonth: true,
          usageMonthRef: true,
          updatedAt: true,
        },
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      user,
      usageRecord,
      clients,
      cases: cases.map((c) => ({
        id: c.id,
        clientId: c.clientId,
        clientName: c.client.name,
        status: c.status,
        priority: c.priority,
        benefitType: c.benefitType,
        deadlineDays: c.deadlineDays,
        deadlineDate: c.deadlineDate,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        cnisDocument: c.client.cnisDocument,
        calculations: c.calculations.map((calc) => ({
          ...calc,
          rmi: Number(calc.rmi),
          rma: Number(calc.rma),
          benefitSalary: Number(calc.benefitSalary),
          socialSecurityFactor: calc.socialSecurityFactor ? Number(calc.socialSecurityFactor) : null,
          coefficient: calc.coefficient ? Number(calc.coefficient) : null,
        })),
        retroactives: c.retroactives.map((r) => ({
          ...r,
          monthlyGrossValue: Number(r.monthlyGrossValue),
          totalGrossValue: Number(r.totalGrossValue),
          totalCorrectedValue: Number(r.totalCorrectedValue),
          discountValue: Number(r.discountValue),
          finalNetValue: Number(r.finalNetValue),
        })),
        opinions: c.opinions,
        caseNotes: c.caseNotes,
      })),
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    }

    const filename = `previando-export-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
