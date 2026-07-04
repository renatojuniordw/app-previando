# Previando — App

SaaS B2B para **advocacia previdenciária brasileira**. Automatiza todo o fluxo de trabalho: gestão de clientes, processamento de CNIS, cálculos de benefícios, pareceres com IA, BPC/LOAS, simulações, e mais.

---

## Tech Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Linguagem** | TypeScript 5.7 |
| **Frontend** | React 18, Tailwind CSS 3.4, Zustand, React Hook Form, Zod |
| **Backend** | Next.js API Routes (REST), NextAuth.js v5 |
| **ORM** | Prisma 5 + PostgreSQL 16 |
| **Cache / Queue** | Redis 7 via ioredis + BullMQ |
| **IA** | OpenAI (GPT-4) |
| **Pagamentos** | Mercado Pago |
| **Armazenamento** | Cloudflare R2 |
| **Monitoramento** | Sentry |
| **Testes** | Vitest (unit), Playwright (E2E) |

---

## Requisitos

- Node.js 20+
- Docker e Docker Compose

---

## Configuração inicial

```bash
cp .env.example .env
# Edite o .env com suas chaves
npm install
```

---

## Infraestrutura local (Postgres + Redis)

```bash
# Subir
docker compose up -d

# Parar (mantém dados)
docker compose stop

# Parar e remover tudo (inclusive volumes)
docker compose down -v
```

| Serviço  | Porta local |
|----------|-------------|
| Postgres | 60003       |
| Redis    | 60004       |

---

## Banco de dados

```bash
# Gerar o Prisma Client (após mudanças no schema)
npm run db:generate

# Rodar migrações (desenvolvimento)
npm run db:migrate

# Rodar migrações (produção — sem interatividade)
npm run db:migrate:prod

# Popular banco com dados iniciais (seed)
npm run db:seed

# Abrir Prisma Studio no browser
npm run db:studio
```

> **Primeira vez:** rode `db:migrate` antes de `db:seed`.

---

## Rodando a aplicação

```bash
# Next.js (dev) — http://localhost:60002
npm run dev

# Worker BullMQ (processamento de CNIS + notificações de prazo)
npm run worker

# Testes unitários
npm test

# Testes com watch mode
npm run test:watch

# Testes E2E (Playwright)
npx playwright test
```

> O worker precisa estar rodando em paralelo com o Next.js para processar uploads de CNIS e enviar notificações de prazo (job diário às 8h).

---

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Dev server (porta 60002) |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar produção (porta 60002) |
| `npm run lint` | ESLint |
| `npm test` | Rodar testes unitários (Vitest) |
| `npm run test:watch` | Testes em watch mode |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:migrate` | Migrações (dev) |
| `npm run db:migrate:prod` | Migrações (prod) |
| `npm run db:seed` | Seed do banco |
| `npm run db:studio` | Prisma Studio |
| `npm run worker` | Iniciar BullMQ workers |

---

## Build de produção

```bash
npm run build
npm run start
```

---

## Arquitetura

```
src/
├── app/
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/       # Páginas principais (com sidebar)
│   ├── admin/             # Painel administrativo
│   ├── portal/            # Portal do cliente (token-based)
│   └── api/               # REST API routes
├── components/
│   ├── ui/                # Primitivas reutilizáveis (Button, Modal, Card, etc.)
│   ├── case/              # Componentes de caso (drawers, modais)
│   ├── bpc/               # Componentes do módulo BPC/LOAS
│   ├── pdf/               # Geradores de PDF (React-PDF)
│   ├── dashboard/         # Widgets do dashboard
│   ├── calendar/          # Componentes de calendário
│   └── reports/           # Componentes de relatórios/BI
├── hooks/                 # Custom hooks React
├── store/                 # Zustand stores
├── lib/                   # Utilitários core
│   ├── previdencia-engine.ts   # Motor de cálculo previdenciário
│   ├── retroativos-engine.ts   # Cálculo de retroativos
│   ├── strategies/             # Strategy pattern por modalidade
│   ├── plan-guard.ts           # Controle de limites por plano
│   ├── ownership.ts            # Anti-IDOR
│   ├── rate-limit.ts           # Rate limiting (Redis + fallback)
│   ├── sanitize.ts             # Sanitização (XSS, CPF, AI)
│   ├── revision-engine.ts      # Motor de revisão de benefícios
│   ├── viability-score.ts      # Score de viabilidade determinístico
│   └── gps-engine.ts           # Guias de contribuição GPS/DAS
├── services/              # Lógica de negócio
│   ├── previdencia/       # Orchestrators de cálculo
│   ├── bpc/               # Serviço BPC/LOAS
│   ├── cnis/              # Processamento de CNIS
│   ├── revision-service.ts # Revisão de benefícios
│   └── mercadopago.ts     # Integração de pagamentos
├── jobs/                  # BullMQ workers
│   ├── worker.ts          # Entry point
│   ├── cnis-worker.ts     # Processamento de CNIS
│   ├── deadline-worker.ts # Notificações de prazo
│   ├── email-worker.ts    # Envio de emails
│   └── audit-worker.ts    # Logs de auditoria
└── types/                 # Tipos compartilhados
```

### Workers (BullMQ)

O sistema usa 4 workers para processamento assíncrono, iniciados via `npm run worker`:

| Worker | Queue | Função |
|---|---|---|
| CNIS | `cnis-processing` | OCR + parser de extratos previdenciários |
| Audit | `audit-log` | Persistência de logs de auditoria |
| Deadline | `deadline-notifications` | Notificações de prazo (daily 8h) |
| Email | `email-notifications` | Envio de emails (opcional, se SMTP configurado) |

### Segurança

- **CPF**: armazenado como HMAC-SHA256 (nunca plaintext)
- **Anti-IDOR**: toda rota verifica ownership via `verifyCaseOwnership()` — retorna 404 (não 403) para não vazar existência
- **Rate limiting**: Redis sorted set sliding window, com fallback in-memory
- **Validação**: Zod em todas as rotas que aceitam request body
- **Webhooks**: verificação HMAC-SHA256

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | URL de conexão com o Postgres |
| `NEXTAUTH_SECRET` | ✅ | Gere com `openssl rand -base64 32` |
| `CPF_HASH_SALT` | ✅ | Salt fixo para hash de CPF — **nunca alterar após o primeiro deploy** |
| `REDIS_URL` | ❌ | Default: `redis://localhost:60004` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ❌ | Credenciais OAuth do Google |
| `AI_PROVIDER` | ❌ | `openai` (padrão) ou `verboo` |
| `OPENAI_API_KEY` | ❌ | Chave da OpenAI (se `AI_PROVIDER=openai`) |
| `VERBOO_API_KEY` | ❌ | Chave do Verboo (se `AI_PROVIDER=verboo`) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | ❌ | Cloudflare R2 |
| `MERCADOPAGO_ACCESS_TOKEN` | ❌ | Integração Mercado Pago |
| `MERCADOPAGO_WEBHOOK_SECRET` | ❌ | HMAC webhook MP |
| `MP_PLAN_ID_SOLO` / `MP_PLAN_ID_PRO` | ❌ | IDs dos planos no Mercado Pago |
| `DATAJUD_API_KEY` | ❌ | API pública do CNJ |

| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | ❌ | Config de email (worker opcional) |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry monitoring |

---

## Endpoints de Health Check

| Rota | Descrição |
|---|---|
| `GET /api/health` | DB, Redis, R2 |
| `GET /api/health/workers` | Filas BullMQ |
