import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const limits = await prisma.planLimit.findMany({
      orderBy: { maxClients: 'asc' },
    })

    const VISIBLE_PLANS = ['FREE', 'SOLO', 'PRO']
    const plans = limits
      .filter((l) => VISIBLE_PLANS.includes(l.plan))
      .map((l) => ({
        plan: l.plan,
        price: l.plan === 'FREE' ? 0 : l.plan === 'SOLO' ? 97 : 197,
        limits: l,
      }))

    return NextResponse.json({ plans })
  } catch (err) {
    return handleApiError(err)
  }
}
