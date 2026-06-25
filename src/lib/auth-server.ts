import { auth } from '@/auth'
import { prisma } from './prisma'

/**
 * Wraps auth() and always fetches plan/isAdmin fresh from DB.
 * Use in API routes (Node.js only — not Edge/middleware).
 */
export async function authWithFreshPlan() {
  const session = await auth()
  if (!session?.user?.id) return session

  const fresh = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, isAdmin: true },
  })

  if (!fresh) return null

  session.user.plan = fresh.plan
  session.user.isAdmin = fresh.isAdmin

  return session
}
