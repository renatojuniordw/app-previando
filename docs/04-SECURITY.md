# 04 — SECURITY
> Auth, Middleware, Bloqueios Físicos, Sanitização e Rate Limiting — Previando

---

## Princípios

1. Login sempre obrigatório em app.previando.com.br
2. Todo bloqueio de plano verificado no banco via API
3. Validação dupla: Zod no frontend (UX) + Zod no backend (segurança)
4. Prisma em toda query — zero SQL injection por design
5. Usuário só acessa seus próprios dados (anti-IDOR)
6. IA sempre recebe input sanitizado
7. **Cálculos Previdenciários Blindados no Backend:** Toda lógica de cálculo, elegibilidade, planejamento/projeção de cenários e atualização monetária (INPC) é executada estritamente no servidor. O frontend atua apenas como coletor de parâmetros, fechando qualquer vulnerabilidade de fraude de dados (ex: alteração de RMI via DevTools ou interceptores de API).


---

## NextAuth v5

```typescript
// lib/auth.ts

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { scope: 'openid email profile' } },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(8).max(100),
        }).safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, password: true, plan: true, isAdmin: true }
        })
        if (!user?.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, plan: user.plan, isAdmin: user.isAdmin }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plan = (user as any).plan
        token.isAdmin = (user as any).isAdmin
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.plan = token.plan as string
      session.user.isAdmin = token.isAdmin as boolean
      return session
    },
  },

  pages: { signIn: '/login', error: '/login' },

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})
```

---

## Middleware Global

```typescript
// middleware.ts

const PUBLIC_ROUTES = ['/login', '/register', '/api/auth']
const ADMIN_ROUTES = ['/admin', '/api/admin']

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  // Públicas
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()

  // Rate limit global (100 req/min por IP via Redis)
  const limit = await rateLimit(`global:${ip}`, 100, 60)
  if (!limit.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  // Auth obrigatória
  if (!session?.user?.id) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!session.user.isAdmin) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    if (pathname.startsWith('/api/admin')) {
      const secret = req.headers.get('x-admin-secret')
      if (secret !== process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
  }

  // Rate limit extra em rotas sensíveis
  const SENSITIVE = ['/api/cnis/upload', '/api/opinions', '/api/export']
  if (SENSITIVE.some(r => pathname.startsWith(r))) {
    const sLimit = await rateLimit(`sensitive:${session.user.id}`, 30, 60)
    if (!sLimit.success) return NextResponse.json({ error: 'Limite de operações atingido.' }, { status: 429 })
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Registro de Usuário

```typescript
// app/api/auth/register/route.ts

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  oabNumber: z.string().optional(),
})

// Rate limit: 3 registros/hora por IP
// Hash bcrypt custo 12
// Cria UsageRecord junto com o usuário
// Cria PlanLimit seed se não existir
```

---

## Anti-SQL Injection

```typescript
// ✅ CORRETO — sempre via Prisma
await prisma.case.findMany({ where: { userId: session.user.id } })

// ✅ CORRETO — raw com template tag parametrizado
await prisma.$queryRaw`SELECT * FROM cases WHERE user_id = ${userId}`

// ❌ NUNCA
await prisma.$queryRawUnsafe(`SELECT * FROM cases WHERE user_id = '${userId}'`)
```

---

## Anti-IDOR

```typescript
// lib/security/ownership.ts
// Sempre retorna 404 (não 403) para não vazar existência do recurso

export async function verifyCaseOwnership(caseId: string, userId: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, userId }, select: { id: true } })
  if (!c) throw new NotFoundError()
}

export async function verifyClientOwnership(clientId: string, userId: string) {
  const c = await prisma.client.findFirst({ where: { id: clientId, userId }, select: { id: true } })
  if (!c) throw new NotFoundError()
}
```

---

## Sanitização

```typescript
// lib/security.ts

export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim().slice(0, 10000)
}

export function hashCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) throw new Error('CPF inválido')
  return crypto.createHmac('sha256', process.env.CPF_HASH_SALT!).update(clean).digest('hex')
}

export const maskCPF = () => '***.***.**-**'

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 13)
}
```

---

## Validação de Upload PDF

```typescript
// lib/security/upload.ts
export async function validatePDFUpload(file: File): Promise<void> {
  if (file.type !== 'application/pdf') throw new Error('Apenas PDFs são aceitos')
  if (file.size > 10 * 1024 * 1024) throw new Error('Máximo 10MB')

  const buffer = await file.arrayBuffer()
  const header = String.fromCharCode(...new Uint8Array(buffer.slice(0, 5)))
  if (!header.startsWith('%PDF-')) throw new Error('Arquivo não é um PDF válido')
}
```

---

## Anti-Prompt Injection

```typescript
// lib/security/ai-sanitizer.ts
export function sanitizeForAI(input: string): string {
  return input
    .replace(/---/g, '').replace(/```/g, '')
    .replace(/ignore (previous|all) instructions/gi, '')
    .replace(/you are now|act as|pretend (you are|to be)|jailbreak/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .slice(0, 3000).trim()
}
```

---

## Headers de Segurança

```typescript
// next.config.ts
module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]}]
  }
}
```

---

## Checklist Pré-Deploy

- [ ] `NEXTAUTH_SECRET` gerado com `openssl rand -base64 32`
- [ ] `CPF_HASH_SALT` gerado e **nunca alterado**
- [ ] `ADMIN_SECRET` configurado
- [ ] Google OAuth com redirect URI `https://app.previando.com.br/api/auth/callback/google`
- [ ] Cookies `httpOnly + secure` em produção
- [ ] PostgreSQL exposto apenas em `127.0.0.1` (porta 60003)
- [ ] Redis exposto apenas em `127.0.0.1` (porta 60004)
- [ ] Portas 60003 e 60004 fechadas no firewall do Contabo (só acessíveis internamente)
- [ ] Middleware cobrindo 100% das rotas de `app.previando.com.br`
- [ ] Ownership verificado em todos os endpoints com IDs
- [ ] Seed de `PlanLimit` rodado
