# 04 — SECURITY
> Auth, Middleware, Bloqueios Físicos, Sanitização e Rate Limiting
> Última atualização: 2026-07-22

---

## Princípios

1. Login sempre obrigatório em app.previando.com.br
2. Todo bloqueio de plano verificado no banco via API
3. Validação dupla: Zod no frontend (UX) + Zod no backend (segurança)
4. Prisma em toda query — zero SQL injection por design
5. Usuário só acessa seus próprios dados (anti-IDOR)
6. IA sempre recebe input sanitizado
7. **Cálculos Previdenciários Blindados no Backend**
8. **Env vars validadas no startup** — fail-fast se faltar variável obrigatória
9. **Token do portal armazenado como hash** — lookup por SHA-256

---

## NextAuth v5

- **Path:** `src/auth.ts` (não `lib/auth.ts`)
- **`SESSION_MAX_AGE = 3600`** (1 hora — reduzido de 24h para maior segurança)
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
|---|---|---|---|
| Upload CNIS | 10 | 1 hora |
| Registro | 3 | 1 hora |
| Forgot/Reset Password | 5 | 1 hora |
| Pareceres IA | 20 | 1 hora |
| Diagnósticos | 10 | 1 hora |
| BPC (formulário) | 10 | 1 hora |
| BPC (análises IA) | 15 | 1 hora |
| Portal (gerar token) | 5 | 1 hora |
| Portal (simulador) | 5 | 1 hora |
| Portal (verify) | 10 | 1 hora |
| Subscribe / Billing | 5 | 1 hora |
| Notes (prontuário) | 20 | 1 hora |
| Status update | 20 | 1 hora |
| Cálculos | 10 | 1 hora |
| Retroativos | 10 | 1 hora |
| Clients (update) | 20 | 1 hora |
| Clients (bulk) | 3 | 1 hora |
| Clients (delete) | 5 | 1 hora |
| Users (password) | 5 | 1 hora |
| Users (profile) | 10 | 1 hora |
| Users (delete account) | 2 | 1 hora |
| PDF tools | 20 | 1 hora |
| Cases (update) | 20 | 1 hora |
| Cases (delete) | 5 | 1 hora |
| Import preview | 10 | 1 hora |

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

## Controle de Acesso (OpenAPI)

- **`GET /api/openapi`**: Schema OpenAPI da aplicação
- **Sem `Access-Control-Allow-Origin: '*'`** — removido em 2026-07-07
- Acesso requer autenticação (cookie de sessão)

---

## CEP Validation

- **Arquivo:** `src/app/api/cep/route.ts`
- Validação com regex `/^\d{8}$/` — apenas dígitos, exatamente 8
- Timeout de 5 segundos via `AbortSignal.timeout(5000)`

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
| `sanitizeForAI(input, maxLen?)` | Anti-prompt injection (melhorias: bloqueio de instruções injetadas, remoção de delimitadores de sistema, sanitização de tokens de controle) |

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

- **CSP:** Nonce-based por requisição — `script-src 'self' 'nonce-{nonce}' 'wasm-unsafe-eval'`. Nunca `'unsafe-inline'`.
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

## Webhook Security

### Mercado Pago
- **Arquivo:** `src/app/api/webhooks/mercadopago/route.ts`
- **Verificação HMAC-SHA256** via `x-signature`, `x-request-id`, `data.id`
- **Comparação timing-safe** usando `timingSafeEqual` (não `===`)
- **Lock por subscription** (Redis, TTL 30s) — previne duplicatas
- **Persistência de eventos brutos** antes do processamento
- **500 em erro** em vez de 200 cego — permite retry automático do MP
- **Não confia no payload** — faz fetch na API MP para dados autoritativos

---

## Checklist Pré-Deploy

- [ ] `NEXTAUTH_SECRET` gerado com `openssl rand -base64 32`
- [ ] `CPF_HASH_SALT` gerado e **nunca alterado**
- [ ] Google OAuth com redirect URI configurado
- [ ] Cookies `httpOnly + secure` em produção
- [ ] PostgreSQL exposto apenas em `127.0.0.1` (porta 60003)
- [ ] Redis exposto apenas em `127.0.0.1` (porta 60004)
- [ ] `.env.production` e `.env.development` no `.gitignore`
- [ ] CORS wildcard removido do OpenAPI
- [ ] Timing-safe comparison no webhook MP
- [ ] Middleware cobrindo 100% das rotas
- [ ] Ownership verificado em todos os endpoints com IDs
- [ ] Seed de `PlanLimit` rodado
- [ ] SMTP configurado para password reset
- [ ] Env vars validadas no startup via `env-validator.ts`

---

## Portal do Cliente — Segurança

### Link Compartilhável

- Token gerado via `crypto.randomBytes(32).toString('base64url')` — 256 bits de entropia
- Token armazenado como **SHA-256 hash** (`tokenHash`) no banco — lookup por hash
- Expira em 30 dias (`expiresAt`)
- Advogado pode revogar a qualquer momento via `DELETE /api/cases/[id]/portal`
- Rate limit: 5 req/hora para simulação (proteção contra brute force)

### Controle de Dados Expostos

O `portalConfig` (JSON no model `Case`) define exatamente quais informações o cliente pode ver:

| Chave | Dados expostos | Risco LGPD |
|---|---|---|
| `showProcessTracking` | Nº processo + movimentações (dado público no CNJ) | Baixo |
| `showCalculations` | RMI, RMA, modalidades | Médio |
| `showRetroactives` | Valores financeiros | Médio |
| `showInterpretation` | Análise textual da IA | Baixo |

**Dados nunca expostos:** CPF, telefone, email, endereço, notas do prontuário.

### Anti-abuso

- Endpoint público (`/api/portal/[token]`) não permite pesquisa por processNumber — apenas por token
- Token expirado retorna 410 Gone (não 404 — não vaza existência)
- Token inválido retorna 404

---

## Variáveis de Ambiente Obrigatórias (env-validator.ts)

- **Arquivo:** `src/lib/env-validator.ts`
- **Valida no startup:** 13 variáveis obrigatórias verificadas antes do servidor iniciar
- **Fail-fast:** Se qualquer variável faltar, o app falha com mensagem clara
- **Variáveis checadas:** `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CPF_HASH_SALT`, variáveis R2, `OPENAI_API_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, SMTP, Google OAuth

---

## Retenção Fiscal (Payment.user SetNull)

- `Payment.user` agora usa `onDelete: SetNull` em vez de `Cascade`
- Quando um usuário é excluído, seus registros de pagamento **não são deletados**
- O campo `userId` torna-se `null`, preservando o registro fiscal
- Conformidade com legislação de retenção de registros financeiros

---

## Account Deletion (Anonimização)

- `POST /api/users/account` agora **anonimiza** clientes e casos em vez de deletá-los fisicamente
- Clientes: campo `anonymizedAt` preenchido, dados pessoais removidos
- Casos: mantidos como registro, dados sensíveis removidos
- LGPD Art. 18, VI — direito de eliminação, com retenção mínima para obrigações legais
- Dados anonimizados não são mais recuperáveis

---

## LGPD / Privacidade

### Cookie Consent
- Componente `CookieConsent.tsx` exibido no primeiro acesso
- Conforme LGPD Art. 7º, I — consentimento explícito para coleta de dados
- Seção de privacidade em `/settings/profile` para gerenciar consentimento

### Anonimização
- Soft delete de usuários: `deletedAt` no modelo `User`
- Anonimização de clientes: `anonymizedAt` no modelo `Client`
- `POST /api/users/account` → anonimiza e deleta dados pessoais (LGPD Art. 18, VI)

### Páginas Públicas
- `/privacidade` — Política de privacidade
- `/termos` — Termos de uso
- Rotas no grupo `(public)/`, sem middleware de autenticação

### Conversão e Tracking
- Eventos de conversão armazenados em `ConversionEvent` (anonimizados)
- UTM params rastreados para marketing (sem PII)
- Consentimento necessário antes de tracking

---

## ErrorBoundary com Sentry

- **Arquivo:** `src/components/ErrorBoundary.tsx`
- Implementa `componentDidCatch` para captura de erros não tratados
- Integração com Sentry via `Sentry.captureException()`
- UI de fallback amigável com botão "Tentar novamente"
- Loga detalhes do erro no console em desenvolvimento
