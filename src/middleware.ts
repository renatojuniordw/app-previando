import { NextResponse } from 'next/server'
import { auth } from '@/auth.edge'
import { buildCSP } from '@/lib/csp'

// ioredis não é compatível com Edge Runtime (middleware).
// O rate limiting é aplicado diretamente nas API routes, onde o Node.js runtime está disponível.

const PUBLIC_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin', '/api/admin']

// Prefixos que precisam ficar acessíveis sem sessão de usuário:
// - /api/auth: rotas do NextAuth
// - /api/webhooks: chamadas server-to-server (MP), autenticadas por HMAC próprio
// - /portal e /api/portal: Portal do Cliente, acessado pelo segurado via token (sem conta)
// - /api/health: monitoramento externo / load balancer
// - /api/cron: jobs agendados, autenticados por CRON_SECRET próprio
const PUBLIC_PREFIXES = ['/api/auth', '/api/webhooks', '/api/portal', '/portal', '/api/health', '/api/cron']

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

// Web Crypto API (disponível no Edge Runtime — 'crypto' do Node não é)
function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
}

function withCSP(res: NextResponse, csp: string): NextResponse {
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const nonce = generateNonce()
  const csp = buildCSP(nonce)

  // O App Router do Next.js lê o nonce a aplicar nos próprios scripts inline
  // (hydration/runtime) do header `content-security-policy` da REQUISIÇÃO
  // (não da resposta) — por isso precisa ir tanto aqui quanto na resposta.
  // Repassamos também via `x-nonce` para o caso de precisarmos anotar algum
  // <script> próprio manualmente em algum Server Component.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  if (isPublic(pathname)) {
    return withCSP(NextResponse.next({ request: { headers: requestHeaders } }), csp)
  }

  // Autenticação obrigatória
  if (!session?.user?.id) {
    if (pathname.startsWith('/api/')) {
      return withCSP(NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }), csp)
    }
    return withCSP(NextResponse.redirect(new URL('/login', req.url)), csp)
  }

  // Rotas admin: requer isAdmin
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session.user.isAdmin) {
      if (pathname.startsWith('/api/')) {
        return withCSP(NextResponse.json({ error: 'Acesso negado.' }, { status: 403 }), csp)
      }
      return withCSP(NextResponse.redirect(new URL('/dashboard', req.url)), csp)
    }
  }

  return withCSP(NextResponse.next({ request: { headers: requestHeaders } }), csp)
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.png$|.*\\.svg$).*)'],
}
