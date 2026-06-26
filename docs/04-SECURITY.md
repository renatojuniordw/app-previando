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
// src/auth.ts

// Session duration in seconds (24h)
const SESSION_MAX_AGE = 86400

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan: string
      isAdmin: boolean
    }
  }
}

async function enrichSessionUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, isAdmin: true },
  })
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },

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
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8).max(100),
          })
          .safeParse(credentials)

        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            plan: true,
            isAdmin: true,
          },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in — CredentialsProvider returns plan/isAdmin directly;
        // Google OAuth does not, so fall back to a DB fetch.
        const extUser = user as typeof user & { plan?: string; isAdmin?: boolean }
        const credPlan = extUser.plan
        const credIsAdmin = extUser.isAdmin
        if (credPlan !== undefined && credIsAdmin !== undefined) {
          token.plan = credPlan
          token.isAdmin = credIsAdmin
        } else if (user.id) {
          const dbUser = await enrichSessionUser(user.id)
          if (!dbUser) return null // user not found in DB -> reject token
          token.plan = dbUser.plan
          token.isAdmin = dbUser.isAdmin
        }
      }

      if (trigger === 'update') {
        const userId = (typeof token.sub === 'string' ? token.sub : undefined)
                    ?? (typeof token.id === 'string' ? token.id : undefined)
        if (userId) {
          const dbUser = await enrichSessionUser(userId)
          if (!dbUser) return null // user deleted -> invalidate token
          token.plan = dbUser.plan
          token.isAdmin = dbUser.isAdmin
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }

      session.user.plan = (token.plan as string | undefined) ?? 'FREE'
      session.user.isAdmin = (token.isAdmin as boolean | undefined) ?? false

      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
```

**Destaques:**
- **Path:** `src/auth.ts` (não `lib/auth.ts`)
- **`SESSION_MAX_AGE = 86400`** (24 horas)
- **JWT callback diferencia Credentials de Google OAuth:** CredentialsProvider retorna `plan`/`isAdmin` diretamente; Google OAuth requer busca no DB via `enrichSessionUser()`
- **`trigger === 'update'`:** re-busca `plan`/`isAdmin` no DB quando o token é atualizado (ex: upgrade de plano)
- **Session callback usa `token.sub`** (não `token.id`) para identificar o usuário
- **`plan` default: `'FREE'`**; **`isAdmin` default: `false`**
- **Module augmentation:** `declare module 'next-auth'` com interface `Session.user` estendida
- **Configuração customizada de cookies NÃO está presente** — usa defaults do NextAuth

---

## Middleware Global

```typescript
// src/middleware.ts

// ioredis não é compatível com Edge Runtime (middleware).
// O rate limiting é aplicado diretamente nas API routes, onde o Node.js runtime está disponível.

const PUBLIC_PAGES = ['/login', '/register']
const ADMIN_ROUTES = ['/admin', '/api/admin']

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.includes(pathname)) return true
  // Rotas do NextAuth: /api/auth/** (exato ou com subpath)
  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) return true
  return false
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (isPublic(pathname)) {
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
```

**Destaques:**
- **Rate limiting NÃO está no middleware** — ioredis não é compatível com Edge Runtime. O rate limiting é feito diretamente nas API routes (Node.js runtime).
- **`config.matcher`** exclui `*.png` e `*.svg` além dos padrões do Next.js (`_next/static`, `_next/image`, `favicon.ico`)
- **Rotas públicas:** `/login`, `/register`, `/api/auth/**`, plus rotas públicas definidas em `isPublic()`
- **Rotas admin** (`/admin`, `/api/admin`) requerem `session.user.isAdmin`
- **Sem rate limiting global no middleware** — cada API route sensível aplica seu próprio rate limit via `src/lib/rate-limit.ts`

---

## Rate Limiting

```typescript
// src/lib/rate-limit.ts

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

// In-memory fallback rate limiter (used when Redis is unavailable)
const localRateLimits = new Map<string, { count: number; reset: number }>()

function localRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = localRateLimits.get(key)

  if (!existing || now > existing.reset) {
    localRateLimits.set(key, { count: 1, reset: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  existing.count++
  return { success: existing.count <= limit, remaining: Math.max(0, limit - existing.count), reset: existing.reset }
}

// Periodically clean expired entries from local rate limiter
setInterval(() => {
  const now = Date.now()
  localRateLimits.forEach((val, key) => {
    if (now > val.reset) localRateLimits.delete(key)
  })
}, 60000)

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  try {
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(redisKey, 0, now - windowMs)
    pipeline.zadd(redisKey, now, `${now}`)
    pipeline.zcard(redisKey)
    pipeline.expire(redisKey, windowSeconds)

    const results = await pipeline.exec()
    const count = (results?.[2]?.[1] as number) ?? 0

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: now + windowMs,
    }
  } catch {
    // Redis indisponível -> usa fallback local
    return localRateLimit(key, limit, windowMs)
  }
}
```

**Destaques:**
- **Sliding window via Redis** usando `ZSET` (`zremrangebyscore` + `zadd` + `zcard`)
- **Fallback em memória** (`Map`) quando Redis está indisponível
- **Retorna `{ success, remaining, reset }`** para uso direto em respostas HTTP
- **Cleanup periódico** via `setInterval` a cada 60s para entradas expiradas no fallback local
- **Chave prefixada com `rl:`** no Redis para evitar colisões

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
// src/lib/ownership.ts
// Sempre retorna 404 (não 403) — não vaza existência do recurso (anti-IDOR)

export async function verifyCaseOwnership(caseId: string, userId: string): Promise<void> {
  const c = await prisma.case.findFirst({
    where: { id: caseId, userId },
    select: { id: true },
  })
  if (!c) throw new NotFoundError()
}

export async function verifyClientOwnership(clientId: string, userId: string): Promise<void> {
  const c = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  })
  if (!c) throw new NotFoundError()
}
```

**Destaques:**
- **`verifyCaseOwnership()`** e **`verifyClientOwnership()`** verificam que o recurso pertence ao usuário autenticado
- **Retorna 404 (não 403)** para evitar vazamento de informação sobre existência de recursos

---

## Sanitização

```typescript
// src/lib/sanitize.ts

// Escapes user-controlled strings for safe embedding in HTML
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return String(str ?? '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .slice(0, 10000)
}

export function hashCPF(cpf: string): string {
  const salt = process.env.CPF_HASH_SALT
  if (!salt) throw new Error('CPF_HASH_SALT não configurado — defina a variável de ambiente antes de usar esta função')
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) throw new Error('CPF inválido')
  return createHmac('sha256', salt).update(clean).digest('hex')
}

export const maskCPF = (cpf?: string) => {
  if (!cpf) return '***.***.**-**'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return '***.***.**-**'
  return `${digits.slice(0, 3)}.***.${digits.slice(6, 9)}-**`
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 13)
}

export function sanitizeForAI(input: string, maxLength: number = 3000): string {
  return input
    .replace(/---/g, '')
    .replace(/```/g, '')
    .replace(/ignore (previous|all) instructions/gi, '')
    .replace(/you are now|act as|pretend (you are|to be)|jailbreak/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .slice(0, maxLength)
    .trim()
}
```

**Destaques:**
- **Path:** `src/lib/sanitize.ts` (não `lib/security.ts`)
- **`sanitizeInput()`:** DOMPurify com `ALLOWED_TAGS: []`, `ALLOWED_ATTR: []` — remove todas as tags HTML
- **`hashCPF()`:** HMAC-SHA256 com salt de ambiente (`CPF_HASH_SALT`)
- **`maskCPF()`:** Máscara parcial — mostra primeiros 3 e dígitos do meio 3: `XXX.***.YYY-**`
- **`sanitizeForAI()`:** `maxLength` configurável (default 3000), preserva tabs e quebras de linha
- **`sanitizePhone()`:** Padroniza para formato `55DDDDDDDDDDD` (apenas dígitos, max 13)
- **`escapeHtml()`:** Escapamento de entidades HTML para `&`, `<`, `>`, `"`, `'`

---

## Validação de Upload PDF

```typescript
// src/lib/upload-validator.ts

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function validatePDFUpload(buffer: Buffer, fileName: string, mimeType: string): Promise<void> {
  if (mimeType !== 'application/pdf') {
    throw new Error('Apenas arquivos PDF são aceitos.')
  }

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new Error('Tamanho máximo permitido: 10MB.')
  }

  // Verifica magic bytes: todo PDF começa com %PDF-
  const header = buffer.slice(0, 5).toString('ascii')
  if (!header.startsWith('%PDF-')) {
    throw new Error('Arquivo não é um PDF válido.')
  }

  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('Extensão do arquivo deve ser .pdf.')
  }
}
```

**Destaques:**
- **Assinaatura:** `validatePDFUpload(buffer, fileName, mimeType)` — recebe 3 parâmetros (não um objeto `File`)
- **4 camadas de validação:** MIME type, tamanho (10MB), magic bytes (`%PDF-`), extensão do arquivo (`.pdf`)

---

## Headers de Segurança

```typescript
// next.config.mjs

const isDev = process.env.NODE_ENV === 'development'

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' required for Next.js hydration scripts; 'unsafe-eval' required for dev HMR
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.unsplash.com https://lh3.googleusercontent.com",
  "font-src 'self'",
  // ws:/wss: required for Next.js dev HMR websocket; r2.cloudflarestorage.com for presigned PDF fetch
  isDev ? "connect-src 'self' ws: wss: https://*.r2.cloudflarestorage.com" : "connect-src 'self' https://*.r2.cloudflarestorage.com",
  // blob: required for PDF viewer (fetch from R2 -> createObjectURL -> iframe)
  "frame-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// Headers aplicados em todas as rotas:
// - X-Frame-Options: DENY
// - X-Content-Type-Options: nosniff
// - Strict-Transport-Security: max-age=31536000; includeSubDomains
// - Content-Security-Policy: (CSP acima)
// - Referrer-Policy: strict-origin-when-cross-origin
// - Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Destaques:**
- **`frame-ancestors: 'none'`** — previne clickjacking
- **`frame-src: 'self' blob:`** — permite viewer de PDF via blob URLs
- **`connect-src`** inclui `https://*.r2.cloudflarestorage.com` para fetch de PDFs presigned
- **`script-src`** usa `'unsafe-eval'` apenas em desenvolvimento (HMR)
- **`img-src`** inclui `lh3.googleusercontent.com` para avatares do Google OAuth
- **Headers adicionais:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`

---

## Regra sobre Respostas de Erro Zod

Nunca expor `details: parsed.error.flatten()` em respostas 400. Isso vaza nomes de campos internos do schema. Retornar apenas `{ error: 'Dados inválidos.' }`.

```typescript
// ❌ NUNCA — vaza schema interno
return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })

// ✅ CORRETO
return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
```

---

## Checklist Pré-Deploy

- [ ] `NEXTAUTH_SECRET` gerado com `openssl rand -base64 32`
- [ ] `CPF_HASH_SALT` gerado e **nunca alterado**
- [ ] Google OAuth com redirect URI `https://app.previando.com.br/api/auth/callback/google`
- [ ] Cookies `httpOnly + secure` em produção
- [ ] PostgreSQL exposto apenas em `127.0.0.1` (porta 60003)
- [ ] Redis exposto apenas em `127.0.0.1` (porta 60004)
- [ ] Portas 60003 e 60004 fechadas no firewall do Contabo (só acessíveis internamente)
- [ ] Middleware cobrindo 100% das rotas de `app.previando.com.br`
- [ ] Ownership verificado em todos os endpoints com IDs
- [ ] Seed de `PlanLimit` rodado
