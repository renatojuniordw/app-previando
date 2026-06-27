import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Chamado uma vez por mês via cron externo (ex: Vercel Cron, cron do servidor, etc.)
// Proteção por secret token via Authorization header: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count } = await prisma.usageRecord.updateMany({
    where: {
      usageMonthRef: { lt: currentMonth },
    },
    data: {
      calculationsThisMonth: 0,
      opinionsThisMonth: 0,
      bpcAnalysesThisMonth: 0,
      bpcSocialMediaThisMonth: 0,
      usageMonthRef: now,
    },
  })

  return NextResponse.json({ ok: true, resetCount: count })
}
