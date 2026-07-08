import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

// Funil de conversão do paywall, por feature:
//   view (teaser/modal) → clique no CTA → pagamento aprovado em até 7 dias.
// "Conversão" = usuário distinto que clicou em um CTA e teve Payment APPROVED
// dentro da janela — atribuição simples de última interação por feature.

const CONVERSION_WINDOW_DAYS = 7

interface FunnelRow {
  feature: string
  teaserViews: number
  teaserClicks: number
  modalViews: number
  modalClicks: number
  uniqueClickers: number
  conversions: number
}

export async function GET() {
  try {
    const adminResult = await requireAdmin()
    if ('error' in adminResult) return adminResult.error

    const [counts, clickers, conversions] = await Promise.all([
      prisma.conversionEvent.groupBy({
        by: ['feature', 'event'],
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ feature: string; users: number }[]>`
        SELECT feature, COUNT(DISTINCT "userId")::int AS users
        FROM conversion_events
        WHERE event::text IN ('TEASER_CTA_CLICK', 'PAYWALL_MODAL_CTA_CLICK')
        GROUP BY feature
      `,
      prisma.$queryRaw<{ feature: string; converted: number }[]>`
        SELECT ce.feature, COUNT(DISTINCT ce."userId")::int AS converted
        FROM conversion_events ce
        JOIN payments p ON p."userId" = ce."userId"
          AND p.status = 'APPROVED'
          AND p."paidAt" IS NOT NULL
          AND p."paidAt" >= ce."createdAt"
          AND p."paidAt" <= ce."createdAt" + make_interval(days => ${CONVERSION_WINDOW_DAYS})
        WHERE ce.event::text IN ('TEASER_CTA_CLICK', 'PAYWALL_MODAL_CTA_CLICK')
        GROUP BY ce.feature
      `,
    ])

    const byFeature = new Map<string, FunnelRow>()
    const getRow = (feature: string): FunnelRow => {
      let row = byFeature.get(feature)
      if (!row) {
        row = { feature, teaserViews: 0, teaserClicks: 0, modalViews: 0, modalClicks: 0, uniqueClickers: 0, conversions: 0 }
        byFeature.set(feature, row)
      }
      return row
    }

    for (const c of counts) {
      const row = getRow(c.feature)
      const n = c._count._all
      if (c.event === 'TEASER_VIEW') row.teaserViews = n
      else if (c.event === 'TEASER_CTA_CLICK') row.teaserClicks = n
      else if (c.event === 'PAYWALL_MODAL_VIEW') row.modalViews = n
      else if (c.event === 'PAYWALL_MODAL_CTA_CLICK') row.modalClicks = n
    }
    for (const c of clickers) getRow(c.feature).uniqueClickers = c.users
    for (const c of conversions) getRow(c.feature).conversions = c.converted

    const funnel = Array.from(byFeature.values()).sort(
      (a, b) => (b.teaserClicks + b.modalClicks) - (a.teaserClicks + a.modalClicks)
    )

    return NextResponse.json({ funnel, conversionWindowDays: CONVERSION_WINDOW_DAYS })
  } catch (err) {
    return handleApiError(err)
  }
}
