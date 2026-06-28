# Documentação de Contexto e Arquitetura — Previando App

> Última atualização: 2026-06-27
> Este documento fornece um panorama geral da arquitetura, bibliotecas e estrutura do projeto.

---

## 1. Visão Geral da Arquitetura

O projeto é uma aplicação web Full-Stack baseada em **Next.js 14 (App Router)**, desenvolvida para gerenciar casos previdenciários (cálculos, benefícios, simulações, BPC e CNIS).

### Principais Padrões e Componentes:
- **Frontend:** Next.js App Router com Server/Client Components, Tailwind CSS, Zustand, Lucide React
- **Backend / API:** API Routes em `src/app/api/...` com autenticação NextAuth v5
- **Banco de Dados:** PostgreSQL via Prisma ORM
- **Filas e Processamento:** BullMQ com Redis (CNIS processing, audit log, deadline notifications)
- **IA:** OpenAI SDK (gpt-4.1-mini, gpt-4.1-nano, gpt-4o-mini)
- **Storage:** Cloudflare R2 (PDF CNIS e documentos)
- **Pagamentos:** Mercado Pago (assinaturas recorrentes)
- **Monitoramento Processual:** DataJud (API pública CNJ)
- **WhatsApp:** Z-API / Meta Cloud API
- **Email:** Nodemailer (password recovery)

---

## 2. Principais Bibliotecas

### Core e Framework
- `next` (^14.2), `react` / `react-dom` (^18.3), `typescript`

### Banco e ORM
- `@prisma/client` / `prisma` (^5.22)

### Autenticação e Segurança
- `next-auth` (^5.0.0-beta.25), `@auth/prisma-adapter`, `bcryptjs`, `isomorphic-dompurify`, `zod`

### Filas e Processamento
- `bullmq` (^5.23), `ioredis`

### IA
- `openai` (^4.73)

### PDF
- `pdf-parse`, `pdfkit`, `@react-pdf/renderer`, `tesseract.js`

### UI
- `tailwindcss`, `clsx`, `tailwind-merge`, `lucide-react`, `react-hook-form`, `zustand`, `recharts`, `react-markdown`, `@dnd-kit/core`

### Utilitários
- `date-fns`, `date-fns-tz`, `axios`, `nodemailer`

### Pagamentos
- `mercadopago` (^2.0.15)

---

## 3. Estrutura de Diretórios

```text
prisma/                 # Schema + migrations + seed
docs/                   # Documentação (16 arquivos)
src/
├── app/                # Next.js App Router
│   ├── (auth)/         # Login, Register, Forgot/Reset Password
│   ├── (dashboard)/    # Dashboard, Cases, Clients, Deadlines, Activity, Tools, Settings
│   ├── admin/          # Admin (Users, Payments, Metrics, Plans, CRUDs)
│   └── api/            # API Routes (auth, admin, cases, cnis, billing, webhooks, etc.)
├── components/         # React Components
│   ├── ui/             # Base (Button, Badge, Modal, Drawer, Card, Input)
│   ├── bpc/            # BPC (BpcForm, BpcResult, BpcSocialInterview, BpcLaudoModal)
│   ├── case/           # Drawers (Notes, Checklist, Opinions, BPC, FAB)
│   ├── dashboard/      # Dashboard (KPI Grid, Charts, Deadlines, Pipeline)
│   ├── pdf/            # PDF (Case, BPC, Compare, Consolidated)
│   ├── client/         # ClientFloatingActions
│   ├── cases/          # CnisInfoCard
│   ├── Sidebar.tsx, Header.tsx, UsageBar.tsx, UpgradeModal.tsx, ToastContainer.tsx
│   └── ClientSwitcher.tsx, ErrorBoundary.tsx
├── hooks/              # useBodyScrollLock, useUrgentDeadlines
├── jobs/               # BullMQ Workers (cnis, audit, deadline)
├── lib/                # Utilitários
│   ├── prisma.ts, redis.ts, auth.ts, auth-server.ts
│   ├── openai.ts, ai-models.ts
│   ├── sanitize.ts, rate-limit.ts, logger.ts, api-error.ts
│   ├── plan-guard.ts, ownership.ts, admin-guard.ts, audit.ts
│   ├── previdencia-engine.ts, retroativos-engine.ts
│   ├── salario-minimo.ts, regras-aposentadoria.ts, modalidades.ts
│   ├── pdf-generator.ts, upload-validator.ts, email.ts
│   ├── mappers.ts, constants.ts, modalidade-labels.ts
│   ├── bpc-notes.ts, previdenciario-constants.ts
│   └── prompts/bpc/   # Prompts BPC (pre-analysis, laudo-analysis, questions, checklist)
├── services/           # Lógica de negócio
│   ├── bpc/            # BPC analysis (5 funções AI)
│   ├── cnis/           # Parser CNIS (programmatic + AI)
│   ├── previdencia/    # Calculation, Simulation, Retroativo orchestrators
│   ├── opinion-generator.ts, register.ts, r2.ts
│   ├── datajud.ts, whatsapp.ts, mercadopago.ts, query-cnis.ts
├── store/              # Zustand (sidebar, upgrade-modal, toast)
└── types/              # bpc-social.ts
```

---

## 4. Fluxos Principais

### CNIS Processing
Upload → R2 → BullMQ → Parser Programático (regex) → Validação AI (gpt-4.1-nano) → Fallback AI (gpt-4.1-mini) → DB

### Cálculo Previdenciário
CNIS COMPLETED → Seleciona modalidade → Busca salário mínimo + regras vigentes → Motor de cálculo → Salva

### Pagamento (Mercado Pago)
POST /subscribe → MP subscription → Webhook → Atualiza plano → Cache invalidado

### Recuperação de Senha
POST /forgot-password → Token → Email SMTP → POST /reset-password → Hash nova senha

### Consulta DataJud
POST /cases/[id]/process → API pública CNJ → Atualiza campos de processo

### WhatsApp
Provider Z-API ou Meta → Envio de mensagem → Resposta com messageId

---

## 5. Recomendações para Agentes

- **Lógica de negócio pesada:** Buscar em `src/services` ou `src/lib`
- **Rotas de API:** `src/app/api/...route.ts`
- **Páginas:** `src/app/(dashboard)/cases/[id]/page.tsx`
- **Autenticação:** Usar `auth()` de `src/auth.ts`
- **Processos lentos:** Delegar para BullMQ (`src/jobs`)
- **Checar plano:** Usar `guardFeature()` de `src/lib/plan-guard.ts`
- **Anti-IDOR:** Usar `verifyCaseOwnership()` de `src/lib/ownership.ts`
