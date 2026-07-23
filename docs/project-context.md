# Documentação de Contexto e Arquitetura — Previando App

> Última atualização: 2026-07-22
> Este documento fornece um panorama geral da arquitetura, bibliotecas e estrutura do projeto.

---

## 1. Visão Geral da Arquitetura

O projeto é uma aplicação web Full-Stack baseada em **Next.js 14 (App Router)**, desenvolvida para gerenciar casos previdenciários (cálculos, benefícios, simulações, BPC, CNIS e revisões).

### Principais Padrões e Componentes:
- **Frontend:** Next.js App Router com Server/Client Components, Tailwind CSS, Zustand, Lucide React, Radix UI, MUI (x-date-pickers)
- **Backend / API:** API Routes em `src/app/api/...` com autenticação NextAuth v5
- **Banco de Dados:** PostgreSQL via Prisma ORM (31 modelos, ~1040 linhas)
- **Filas e Processamento:** BullMQ com Redis (CNIS, audit log, deadline, email, fee)
- **IA:** OpenAI SDK (gpt-4.1-mini, gpt-4.1-nano, gpt-4o-mini)
- **Storage:** Cloudflare R2 (PDF CNIS e documentos)
- **Pagamentos:** Mercado Pago (assinaturas recorrentes)
- **Email:** Nodemailer (password recovery)
- **Process Tracking:** TrackJud webhook para monitoramento processual

---

## 2. Principais Bibliotecas

### Core e Framework
- `next` (^14.2), `react` / `react-dom` (^18.3), `typescript` (^5.7)

### Banco e ORM
- `@prisma/client` / `prisma` (^5.22)

### Autenticação e Segurança
- `next-auth` (^5.0.0-beta.31), `@auth/prisma-adapter`, `bcryptjs`, `isomorphic-dompurify`, `zod`

### Filas e Processamento
- `bullmq` (^5.23), `ioredis`

### IA
- `openai` (^4.73)

### PDF
- `pdf-parse`, `pdfkit`, `@react-pdf/renderer` (dynamic import no frontend), `tesseract.js`

### UI / Design System
- `tailwindcss`, `clsx`, `tailwind-merge`, `lucide-react`, `react-hook-form`, `zustand`, `recharts` (dynamic import), `react-markdown`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@mui/material`, `@emotion/react`, `@ag-media/react-pdf-table`

### Utilitários
- `date-fns`, `date-fns-tz`, `axios`, `axios-retry`, `nodemailer`, `exceljs` (import de clientes)

### Pagamentos
- `mercadopago` (^3.2)

### Monitoramento
- `@sentry/nextjs` (^10.62)

### Testes E2E
- `@playwright/test` (^1.52)

---

## 3. Estrutura de Diretórios

```text
prisma/                 # Schema (~1040 linhas, 31 modelos) + migrations + seed
docs/                   # Documentação (23 arquivos + superpowers/)
src/
├── app/                # Next.js App Router
│   ├── (auth)/         # Login, Register, Forgot/Reset Password + AuthHighlights, AuthTransition, CookieConsent
│   ├── (dashboard)/    # Dashboard, Cases, Clients, Deadlines, Calendar, Activity,
│   │                   #   Reports, Honorarios, Suporte, Tools (PDF, CNIS Indicators), Settings
│   │   ├── cases/
│   │   │   ├── import/ # Página de importação de casos via CSV (nova)
│   │   │   └── [id]/
│   │   │       └── scenarios/  # Página de cenários de simulação (nova)
│   ├── (public)/       # Privacidade, Termos (páginas públicas LGPD)
│   ├── admin/          # Admin (Dashboard, Users, Payments, Metrics, Plans, Modalidades,
│   │                   #   Regras, Salário Mínimo, Suporte, Audit Integrity)
│   ├── portal/         # Client portal (token-based) com FAQ, Timeline, Simulador
│   └── api/            # API Routes (auth, admin, cases, cnis, billing, webhooks, cep,
│                       #   search, export, portal, support, track, cron, etc.)
├── components/         # React Components
│   ├── ui/             # 30 primitives (Button, Badge, Modal, Drawer, Card, Input, Spinner,
│   │                   #   PageHeader, PageError, AlertBanner, EmptyState, ConfirmDialog,
│   │                   #   ActionsDropdown, BottomSheet, FilterSheet, MobileBottomNav,
│   │                   #   QuickActionSheet, Select, Tooltip, CurrencyInput, DatePicker,
│   │                   #   MonthPicker, Skeleton, HelpText, MuiThemeProvider, Popover,
│   │                   #   MobileCardList, FloatingActionMenu, ContextualEmptyState,
│   │                   #   ProgressBar, IconButton)
│   ├── sidebar/        # Subcomponentes da Sidebar (refatorados SRP)
│   │   ├── SidebarNav.tsx
│   │   ├── SidebarUserInfo.tsx
│   │   └── SidebarRecentItems.tsx
│   ├── header/         # Subcomponentes do Header (refatorados SRP)
│   │   ├── NotificationDropdown.tsx
│   │   ├── MobileSearchOverlay.tsx
│   │   └── UserProfileButton.tsx
│   ├── case/           # 9 componentes (CaseNotesDrawer, CaseChecklistDrawer, CaseOpinionsDrawer,
│   │                   #   CaseBpcDrawer, CaseFloatingActions, CasePeticaoModal,
│   │                   #   DrawerRedirect, ModalitySelect, ProcessTimeline)
│   ├── client/         # 11 componentes (ClientFloatingActions, ClientFormPage, ClientHeader,
│   │                   #   ClientPersonalInfoCard, ClientPortalCard, ClientCasesListCard,
│   │                   #   ClientCaseStatsCards, ClientCnisCard, DeleteClientModal,
│   │                   #   EditNotesModal, NewCaseModal)
│   ├── dashboard/      # 7 widgets (KPI Grid, Charts, Deadlines, Pipeline, ActivityFeed,
│   │                   #   QuickActions, OnboardingBanner)
│   ├── reports/        # 7 componentes (BarChart, PieChart, HorizontalBar, ConversionFunnel,
│   │                   #   KpiCard, PeriodSelector, index)
│   ├── bpc/            # BpcForm, BpcFormSection, BpcLaudoModal, BpcResult, BpcSocialInterview
│   ├── pdf/            # 5 componentes (BpcPDFDocument, BpcConsolidatedPDFDocument,
│   │                   #   CasePDFDocument, ComparePDFDocument, styles)
│   ├── admin/          # AdminNav, AdminTable, AdminPagination, AdminCard, metrics/ (8)
│   ├── calendar/       # CalendarEventCard
│   ├── cases/          # CnisInfoCard
│   ├── onboarding/     # OnboardingWizard, OnboardingChecklist, ContextualTooltip
│   ├── portal/         # IdentityVerification, PortalSimulator
│   ├── plan/           # FeatureLockedTeaser
│   ├── search/         # GlobalSearch, SearchResultItem
│   ├── shared/         # AddressFields, FloatingActionMenu (compartilhado Case/Client)
│   ├── Header.tsx, Sidebar.tsx, UsageBar.tsx, UpgradeModal.tsx, ToastContainer.tsx,
│   │   ClientSwitcher.tsx, ErrorBoundary.tsx, ShortcutsModal.tsx
│   │   # Nota: Header.tsx e Sidebar.tsx foram refatorados para delegar a
│   │   # sidebar/ e header/ subcomponentes (SRP)
├── hooks/              # 13 hooks: useApi, useCrudActions, useBodyScrollLock, useFocusTrap,
│                       #   useKeyboardShortcuts, useUrgentDeadlines, useCepLookup,
│                       #   useClientDetail, useCnis, useCnisUpload, usePollingCount
│                       #   (substitui useClientCount + usePendingCasesCount)
├── jobs/               # 6 BullMQ Workers (cnis, audit, deadline, email, fee, worker index)
├── lib/                # ~63 utilitários
│   ├── prisma.ts, redis.ts, auth.ts, auth-server.ts
│   ├── openai.ts, ai-models.ts
│   ├── sanitize.ts, sanitize-server.ts, rate-limit.ts, logger.ts, api-error.ts
│   ├── plan-guard.ts, ownership.ts, admin-guard.ts, audit.ts, audit-hash.ts
│   ├── env-validator.ts    # (novo) Valida 13 env vars obrigatórias no startup
│   ├── json-schema.ts      # (novo) Utilitários de schema JSON
│   ├── portal-access.ts    # (novo) Helper getPortalAccess() — DRY nas 7 rotas do portal
│   ├── case-import-parser.ts # (novo) Parser de CSV para importação de casos
│   ├── previdencia-engine.ts, retroativos-engine.ts, gps-engine.ts, viability-score.ts
│   ├── cause-value-engine.ts, revision-engine.ts
│   ├── salario-minimo.ts, regras-aposentadoria.ts, modalidades.ts
│   ├── pdf-generator.ts, upload-validator.ts, email.ts, download-pdf.ts
│   ├── mappers.ts, constants.ts, modalidade-labels.ts, utils.ts, masks.ts, api.ts
│   ├── bpc-notes.ts, previdenciario-constants.ts, sentry.ts, csp.ts
│   ├── portal-config.ts, portal-session.ts, glossary.ts, cnj-parser.ts
│   ├── feature-marketing.ts, track-conversion.ts, fetch-client-info.ts
│   ├── client-import-parser.ts, cnis-status.ts, fee-status.ts
│   ├── account-deletion.ts, encryption.ts, oauth-token-adapter.ts
│   ├── request-ip.ts, cpf.ts, br-data.ts
│   └── prompts/
│       ├── bpc/        # Pre-analysis, laudo-analysis, questions, checklist
│       ├── peticao-inicial/
│       ├── portal/     # FAQ
│       └── strategies/ # assistenciais, registry, retirement, revision-types, revision, types
├── services/           # Lógica de negócio
│   ├── bpc/            # BPC analysis (5 funções AI)
│   ├── cnis/           # Parser CNIS (programmatic + AI + indicadores + types)
│   ├── previdencia/    # Calculation, Simulation, Retroativo, CauseValue orchestrators
│   ├── opinion-generator.ts, register.ts, r2.ts, peticao-generator.ts
│   ├── mercadopago.ts, query-cnis.ts, revision-service.ts
│   ├── google-calendar.ts, email-service.ts, cnis-parser.ts
│   └── previdencia-service.ts
├── store/              # 6 Zustand (sidebar, upgrade-modal, toast, admin-sidebar, recent-store, search-store)
├── types/              # bpc-social.ts, cnis.ts, xlsx.d.ts
├── middleware.ts       # Middleware global (auth + admin guard)
└── e2e/                # Testes E2E (Playwright)
    ├── playwright.config.ts
    ├── auth.setup.ts
    ├── dashboard.spec.ts
    ├── cases.spec.ts
    └── clients.spec.ts
```

> **Convenções AGENTS.md:** O projeto possui um `AGENTS.md` na raiz que documenta todas as convenções de código, comandos, arquitetura e regras DRY + SOLID para agentes de IA. Consulte-o antes de qualquer modificação no código-fonte.

---

## 4. Fluxos Principais

### CNIS Processing
Upload → R2 → BullMQ → Parser Programático (regex) → Validação AI (gpt-4.1-nano) → Fallback AI (gpt-4.1-mini) → DB

### Cálculo Previdenciário
CNIS COMPLETED → Seleciona modalidade → Busca salário mínimo + regras vigentes → Motor de cálculo → Salva

### BPC/LOAS Analysis
Formulário (patologia, renda, laudos) → Pré-Análise (gpt-4o-mini) → Análise de Laudo → Perguntas Sociais/Médicas → Checklist

### Pagamento (Mercado Pago)
POST /subscribe → MP subscription → Webhook → Atualiza plano → Cache invalidado

### Recuperação de Senha
POST /forgot-password → Token → Email SMTP → POST /reset-password → Hash nova senha

### Monitoramento Processual (TrackJud)
Webhook TrackJud → Atualiza processNumber, movimentações → Notificação ao advogado

### Portal do Cliente
Gerar token → Armazenado como SHA-256 (tokenHash) → Link compartilhável (30 dias) → Acesso a: processo, cálculos, retroativos, FAQ, timeline

### Importação de Casos (CSV)
POST /api/cases/import/preview → Validação → POST /api/cases/import → Criação em lote com parser dedicado

---

## 5. Convenções de Código

### Hooks Compartilhados
- `useApi<T>(url)` → data fetching com loading/error/refetch + AbortController
- `useCrudActions(url, options)` → create/update/remove com toast + loading
- `useBodyScrollLock(condition)` → lock scroll em modais
- `useFocusTrap(ref, active)` → focus trap para acessibilidade
- `useCepLookup(cep)` → busca automática de CEP com debounce
- `useClientDetail(clientId)` → hook de detalhe do cliente com refetch
- `useCnis(caseId)` / `useCnisUpload()` → gerenciamento CNIS
- `usePollingCount(url, interval)` → polling com AbortController + mounted check (substitui `useClientCount` e `usePendingCasesCount`)

### Componentes UI
- Sempre preferir componentes de `src/components/ui/` a estilos inline
- Botões: usar `<Button variant="primary|outline|danger|ghost" size="sm|md|lg">`
- Inputs: usar classe `neo-input` ou componente `<Input>`
- Cards: usar `<Card variant="light|dark">` em vez de `bg-white border...`
- Modais mobile responsivos: `flex-1 min-h-0` no conteúdo para scroll
- FloatingActionMenu: componente compartilhado (shared/) entre Case e Client
- ContextualEmptyState: estado vazio com contexto e ação
- ProgressBar: barra de progresso reutilizável
- IconButton: botão ícone padronizado com tooltip

### Performance
- Dynamic imports para: PDF, charts, modais/drawers, BpcResult (ssr: false)
- React.memo para: Header, Sidebar, widgets de dashboard
- prefetch={false} em: sidebar links, tabs bloqueadas, notificações
- useApi com AbortController para cancelar requests em unmount

### Mobile
- BottomNav 5 itens (Início, Clientes, Casos, Calendário, Mais)
- Sidebar adaptativa: labels visíveis no mobile, ocultas em desktop collapsed
- Modal mobile: padding adequado, z-index hierarchy
- Global search: Cmd+K no desktop, botão no mobile
- Accessibility: ARIA roles em checkboxes, BottomSheet, focus trap, contraste WCAG

### PWA
- manifest.json com ícones 192x192 e 512x512
- Service worker para cache offline parcial
- Tema slate/amber, background slate-50

### E2E
- Playwright configurado com 3 spec files: auth.setup.ts, dashboard.spec.ts, cases.spec.ts, clients.spec.ts

---

## 6. Mudanças Arquiteturais Recentes

### Header e Sidebar Refatorados (SRP)
- `Header.tsx` delegou para 3 subcomponentes: `NotificationDropdown`, `MobileSearchOverlay`, `UserProfileButton`
- `Sidebar.tsx` delegou para 3 subcomponentes: `SidebarNav`, `SidebarUserInfo`, `SidebarRecentItems`
- Cada subcomponente com responsabilidade única, facilitando manutenção e testes

### Plan Guards Atômicos
- `plan-guard.ts`: funções de guard agora são atômicas — verificam e consomem o recurso numa única operação Redis (check + consume)
- Elimina race conditions entre verificação e consumo

### Auditoria Paginada
- `verifyAuditChainIntegrity()` agora opera em lotes de 1000 registros
- Evita timeout em chains com milhões de entradas

### ClientAccess com tokenHash
- Token do portal não é mais armazenado em plain text
- Novo campo `tokenHash` (SHA-256) para lookup e verificação
- `token` original enviado apenas no link compartilhável

### Payment onDelete: SetNull
- `Payment.user` mudou de `onDelete: Cascade` para `onDelete: SetNull`
- Preserva registros fiscais mesmo após exclusão do usuário

---

## 7. Recomendações para Agentes

- **Lógica de negócio pesada:** Buscar em `src/services` ou `src/lib`
- **Rotas de API:** `src/app/api/...route.ts`
- **Páginas:** `src/app/(dashboard)/cases/[id]/page.tsx`
- **Autenticação:** Usar `auth()` de `src/auth.ts`
- **Processos lentos:** Delegar para BullMQ (`src/jobs`)
- **Checar plano:** Usar `guardFeature()` de `src/lib/plan-guard.ts`
- **Anti-IDOR:** Usar `verifyCaseOwnership()` de `src/lib/ownership.ts`
- **Data fetching:** Usar `useApi<T>(url)` em vez de useState + useEffect manual
- **CRUD:** Usar `useCrudActions(url, { onSuccess })` em vez de try/catch + toast manual
- **CEP:** Usar `useCepLookup()` + validação regex `/^\d{8}$/`
- **Polling:** Usar `usePollingCount(url, interval)` para contagens em tempo real
- **Validação env:** Usar `envValidator.require()` de `src/lib/env-validator.ts`
- **Portal access:** Usar `getPortalAccess()` de `src/lib/portal-access.ts`
- **Antes de criar algo:** Buscar componente/hook existente (DRY + SOLID)
- **Documentação:** Ver `docs/03-FRONTEND.md` para componentes, hooks e padrões
- **Process Tracking:** Integração TrackJud via webhook em `/api/webhooks/trackjud`
