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
    select: { plan: true, isAdmin: true, passwordChangedAt: true },
  })

  if (!fresh) return null

  // Sessão emitida antes da última troca de senha (ex: reset de senha) — invalida.
  // Como a sessão é JWT stateless, isso só é reforçado nas rotas que passam por
  // aqui (Node.js runtime); o middleware (Edge) não pode consultar o banco.
  // Na pior hipótese, uma sessão roubada some no próximo request autenticado
  // em vez de imediatamente — ainda assim, muito melhor que nunca expirar.
  if (
    fresh.passwordChangedAt &&
    session.user.issuedAt &&
    fresh.passwordChangedAt.getTime() > session.user.issuedAt * 1000
  ) {
    return null
  }

  session.user.plan = fresh.plan
  session.user.isAdmin = fresh.isAdmin

  return session
}
