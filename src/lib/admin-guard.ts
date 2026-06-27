import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const ADMIN_CACHE_TTL = 300 // 5 minutos

async function isAdminFromDB(userId: string): Promise<boolean> {
  const cacheKey = `admin:${userId}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached !== null) return cached === '1'
  } catch {
    // Redis indisponível — vai ao DB
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })

  const result = user?.isAdmin ?? false

  try {
    await redis.setex(cacheKey, ADMIN_CACHE_TTL, result ? '1' : '0')
  } catch {
    // Não crítico
  }

  return result
}

export async function invalidateAdminCache(userId: string): Promise<void> {
  try {
    await redis.del(`admin:${userId}`)
  } catch {
    // Não crítico
  }
}

export async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }> {
  const session = await auth()

  if (!session?.user?.id || !session.user.isAdmin) {
    return { error: NextResponse.json({ error: 'Acesso negado.' }, { status: 403 }) }
  }

  const isAdmin = await isAdminFromDB(session.user.id)
  if (!isAdmin) {
    return { error: NextResponse.json({ error: 'Acesso negado.' }, { status: 403 }) }
  }

  return { userId: session.user.id }
}
