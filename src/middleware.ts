import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// ioredis não é compatível com Edge Runtime (middleware).
// O rate limiting é aplicado diretamente nas API routes, onde o Node.js runtime está disponível.

const PUBLIC_ROUTES = ['/login', '/register', '/api/auth']
const ADMIN_ROUTES = ['/admin', '/api/admin']

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Rotas públicas passam livremente
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Autenticação obrigatória
  if (!session?.user?.id) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Rotas admin: requer isAdmin
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session.user.isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
