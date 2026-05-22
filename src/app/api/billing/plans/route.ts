import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const limits = await prisma.planLimit.findMany({
      orderBy: { maxClients: 'asc' },
    })

    const plans = limits.map((l: typeof limits[number]) => ({
      plan: l.plan,
      price: l.plan === 'FREE' ? 0 : l.plan === 'SOLO' ? 299 : 599,
      limits: l,
    }))

    return NextResponse.json({ plans })
  } catch (err) {
    return handleApiError(err)
  }
}
