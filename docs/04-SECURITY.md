# 04 — SECURITY
> Auth, Middleware, Bloqueios Físicos, Sanitização e Rate Limiting
> Última atualização: 2026-06-27

---

## Princípios

1. Login sempre obrigatório em app.previando.com.br
2. Todo bloqueio de plano verificado no banco via API
3. Validação dupla: Zod no frontend (UX) + Zod no backend (segurança)
4. Prisma em toda query — zero SQL injection por design
5. Usuário só acessa seus próprios dados (anti-IDOR)
6. IA sempre recebe input sanitizado
7. **Cálculos Previdenciários Blindados no Backend**

---

## NextAuth v5

- **Path:** `src/auth.ts` (não `lib/auth.ts`)
- **`SESSION_MAX_AGE = 86400`** (24 horas)
- **JWT callback diferencia Credentials de Google OAuth**
- **`trigger === 'update'`:** re-busca plan/isAdmin no DB
- **Session callback usa `token.sub`**
- **`plan` default: `'FREE'`; `isAdmin` default: `false`**

---

## Middleware Global

```typescript
// src/middleware.ts

const PUBLIC_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin', '/api/admin']

// Rotas públicas: /login, /register, /forgot-password, /reset-password, /api/auth/**
// Rotas admin: requer session.user.isAdmin
// Demais: autenticação obrigatória
```

**Destaques:**
- **`/forgot-password` e `/reset-password`** adicionados às páginas públicas
- Rate limiting NÃO está no middleware (ioredis não compatível com Edge Runtime)
- `config.matcher` exclui `*.png` e `*.svg`

---

## Rate Limiting

- **Sliding window via Redis** usando `ZSET`
- **Fallback em memória** (`Map`) quando Redis indisponível
- **Limites por operação:**

| Operação | Limite | Janela |
|---|---|---|
| Upload CNIS | 10 | 1 hora |
| Registro | 3 | 1 hora |
| Pareceres IA | 20 | 1 hora |
| Diagnósticos | 10 | 1 hora |
| BPC (todas) | 15 | 1 hora |
| Carrossel BPC | 15 | 1 hora |

---

## Registro de Usuário

- `POST /api/auth/register`
- Schema: name (2-100), email, password (min 8 + maiúscula + número)
- Rate limit: 3/hora por IP
- Hash bcrypt custo 12
- Transação: cria User + UsageRecord
- Plan padrão: FREE

---

## Recuperação de Senha

- **`POST /api/auth/forgot-password`**: usuário informa email → cria token → envia nodemailer
- **`POST /api/auth/reset-password`**: valida token → atualiza senha
- Token expira em 1 hora
- Email via nodemailer (SMTP configurável)

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
// Sempre retorna 404 (não 403) — não vaza existência do recurso

export async function verifyCaseOwnership(caseId: string, userId: string): Promise<void>
export async function verifyClientOwnership(clientId: string, userId: string): Promise<void>
```

---

## Sanitização

Arquivo: `src/lib/sanitize.ts`

| Função | Descrição |
|---|---|
| `sanitizeInput(value)` | DOMPurify sem tags |
| `escapeHtml(str)` | Escapa HTML |
| `hashCPF(cpf)` | HMAC-SHA256 com salt |
| `maskCPF(cpf?)` | Máscara: XXX.***.YYY-** |
| `sanitizePhone(phone)` | Apenas dígitos, max 13 |
| `sanitizeForAI(input, maxLen?)` | Anti-prompt injection |

---

## Validação de Upload PDF

```typescript
// src/lib/upload-validator.ts
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function validatePDFUpload(buffer: Buffer, fileName: string, mimeType: string): Promise<void>
// 4 validações: MIME type, tamanho (10MB), magic bytes (%PDF-), extensão (.pdf)
```

---

## Headers de Segurança

- **CSP:** script-src 'self' 'unsafe-inline', frame-ancestors 'none', frame-src 'self' blob:, connect-src inclui r2.cloudflarestorage.com
- **X-Frame-Options:** DENY
- **X-Content-Type-Options:** nosniff
- **HSTS:** max-age=31536000; includeSubDomains
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Permissions-Policy:** camera=(), microphone=(), geolocation=()

---

## Regra sobre Respostas de Erro Zod

```typescript
// ❌ NUNCA — vaza schema interno
return NextResponse.json({ error: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 })

// ✅ CORRETO
return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
```

---

## Admin Guard

Arquivo: `src/lib/admin-guard.ts`

```typescript
export async function requireAdmin(): Promise<{ error: NextResponse } | { userId: string }>
// Verifica sessão + cache Redis (TTL 5 min) + DB
```

---

## Checklist Pré-Deploy

- [ ] `NEXTAUTH_SECRET` gerado com `openssl rand -base64 32`
- [ ] `CPF_HASH_SALT` gerado e **nunca alterado**
- [ ] Google OAuth com redirect URI configurado
- [ ] Cookies `httpOnly + secure` em produção
- [ ] PostgreSQL exposto apenas em `127.0.0.1` (porta 60003)
- [ ] Redis exposto apenas em `127.0.0.1` (porta 60004)
- [ ] Middleware cobrindo 100% das rotas
- [ ] Ownership verificado em todos os endpoints com IDs
- [ ] Seed de `PlanLimit` rodado
- [ ] SMTP configurado para password reset
