# Previando — AGENTS.md

## Tech Stack
- **Framework**: Next.js 14 (App Router), TypeScript strict
- **Styling**: Tailwind CSS v3, `@tailwindcss/typography`, lucide-react, Radix UI
- **Database**: Prisma + PostgreSQL 16 (Docker, port 60003)
- **Cache/Queue**: Redis (port 60004), BullMQ workers
- **Auth**: NextAuth v5 (JWT), Credentials + Google OAuth, Prisma adapter
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Mercado Pago subscriptions
- **AI**: OpenAI gpt-4.1-mini (critical), gpt-4.1-nano (operational)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Infra**: Docker Compose, GitHub Actions (CI + E2E)

## Key Conventions
- **API routes only** — no server actions; all backend in `src/app/api/`
- **Double validation** — Zod on frontend (UX) + Zod on backend (security)
- **Plan gating** — `plan-guard.ts` + 402 Axios interceptor
- **Anti-IDOR** — all queries scoped to authenticated user
- **CaseNote immutable** — no updatedAt, sequential versions only
- **CPF hashed** — HMAC-SHA256, never plain text
- **AI as assistant** — temperature 0 for extraction, never autonomous
- **Portuguese-first** — UI labels in Portuguese, lowercase headings, Lucide icons (no emojis)
- **Premium Legal Design** — slate/amber palette, Playfair Display headings, Inter UI, JetBrains Mono code
- **State** — Zustand for global state (sidebar, upgrade-modal, toast, admin-sidebar, recent-store, search-store)
- **DRY First + SOLID (CRITICAL)** — Never create new components/hooks/utils without: (1) searching existing code first (skill: `dry-enforcement`), (2) applying SOLID — SRP, OCP, LSP, ISP, DIP. Cada componente/hook deve ter uma única responsabilidade, ser extensível por composição, depender de abstrações (props), e nunca forçar dependências desnecessárias.
- **12 hooks** — `useApi`, `useCrudActions` (data fetching/CRUD); `useBodyScrollLock`, `useFocusTrap`, `useKeyboardShortcuts` (UI); `useCepLookup`, `useClientCount`, `useClientDetail`, `useCnis`, `useCnisUpload`, `usePendingCasesCount`, `useUrgentDeadlines` (domain)

## Architecture
```
src/
  app/
    (auth)/            login, register, forgot/reset-password (AuthHighlights, AuthTransition, CookieConsent)
    (dashboard)/       main app: Sidebar + Header + UpgradeModal + Toast
      dashboard/       metrics via Recharts
      cases/[id]/      case detail with tabs + drawers + FAB + 15 sub-tabs
      clients/         list, kanban, import, new
      calendar/        90-day calendar view + Google Calendar sync
      reports/         BI reports
      honorarios/      fee tracking
      deadlines/       deadline overview
      activity/        audit log
      suporte/         support tickets
      tools/           PDF tool + CNIS indicators dictionary
      settings/        profile + billing
    (public)/          privacy policy, terms of service
    admin/             dashboard, users, payments, metrics, plans, support, CRUDs
    portal/            client portal (FAQ, timeline, simulator, documents, verify)
    api/               all API routes
  components/
    ui/                27 primitives: Button, Badge, Input, Modal, Drawer, Card,
                       Spinner, PageHeader, PageError, AlertBanner, EmptyState,
                       ActionsDropdown, ConfirmDialog, BottomSheet, FilterSheet,
                       MobileBottomNav, QuickActionSheet, Select, Tooltip, Popover,
                       CurrencyInput, DatePicker, MonthPicker, Skeleton, HelpText,
                       MuiThemeProvider, MobileCardList
    case/              9: CaseNotesDrawer, CaseChecklistDrawer, CaseOpinionsDrawer,
                       CaseBpcDrawer, CasePeticaoModal, CaseFloatingActions,
                       DrawerRedirect, ModalitySelect, ProcessTimeline
    client/            11: ClientFloatingActions, ClientFormPage, DeleteClientModal,
                       ClientHeader, ClientPersonalInfoCard, ClientCasesListCard,
                       ClientCaseStatsCards, ClientCnisCard, ClientPortalCard,
                       EditNotesModal, NewCaseModal
    dashboard/         7 widgets (KPI Grid, Charts, Deadlines, Pipeline, ActivityFeed,
                       QuickActions, OnboardingBanner)
    reports/           BI chart components (7)
    bpc/               5: BpcForm, BpcResult, BpcSocialInterview, BpcFormSection, BpcLaudoModal
    pdf/               5: BpcPDFDocument, BpcConsolidatedPDFDocument, CasePDFDocument,
                       ComparePDFDocument, styles
    onboarding/        OnboardingWizard, OnboardingChecklist, ContextualTooltip
    admin/             AdminNav, AdminTable, AdminPagination, AdminCard, metrics/ (8)
    portal/            IdentityVerification, PortalSimulator
    plan/              FeatureLockedTeaser
    search/            GlobalSearch, SearchResultItem
    shared/            AddressFields
    cases/             CnisInfoCard
    calendar/          CalendarEventCard
  hooks/               12 hooks: useApi, useCrudActions, useBodyScrollLock, useFocusTrap,
                       useKeyboardShortcuts, useUrgentDeadlines, useCepLookup,
                       useClientCount, useClientDetail, useCnis, useCnisUpload,
                       usePendingCasesCount
  lib/                 ~59 shared modules: prisma, redis, engines, prompts, sanitize,
                       api-error (+ extractApiError), utils (+ formatPercentage),
                       modalidade-labels (+ getModalityLabel), glossary, cnj-parser,
                       feature-marketing, track-conversion, encryption, cpf, br-data,
                       csp, request-ip, sanitize-server, account-deletion,
                       client-import-parser, cnis-status, fee-status, cause-value-engine,
                       prisma-user-encryption, prisma-bpc-encryption, email/templates,
                       strategies/, prompts/
  services/            CNIS, BPC, Previdência (calculation, simulation, retroativo, cause-value),
                       Mercado Pago, R2, Opinion Generator, Petição Inicial, Revision,
                       Google Calendar, Email, Register
  jobs/                BullMQ workers
  store/               6 Zustand stores (sidebar, upgrade-modal, toast, admin-sidebar, recent-store, search-store)
  types/               TS type declarations
prisma/schema.prisma — 1030 lines, 31 models (19 enums)
docs/*.md             — 24 comprehensive documentation files (+ superpowers spec/plans)
```

## MCP Telegram
- **Token**: `TELEGRAM_BOT_TOKEN` env var (get from @BotFather)
- **Chat authorization**: By default any chat can message the bot. Use `telegram_authorize_chat` to restrict.
- **First use**: Send `/start` to your bot on Telegram, then use `telegram_get_updates` to find your chat ID, then `telegram_authorize_chat` if needed.
- **Conversation flow**: Use `telegram_send_message` to ask user something, then `telegram_get_updates` to wait for their response.
- **Tools available**: `telegram_send_message`, `telegram_send_photo`, `telegram_send_document`, `telegram_get_updates`, `telegram_get_chat`, `telegram_authorize_chat`, `telegram_list_chats`

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev on port 60002 |
| `npm run build` | Production build |
| `npm run test` | Vitest unit tests |
| `npm run lint` | Next.js lint |
| `npx tsc --noEmit` | TypeScript check |
| `npm run db:studio` | Prisma Studio |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |
| `npm run worker` | Start BullMQ worker |

## .agents/ Directory
Full AG Kit with 20 specialist agents, 45 skills, 13 workflows, and memory system. Reference `.agents/ARCHITECTURE.md` for agent routing and skill loading.

## Documentation
Project context, business rules, database schema, security, AI architecture, and more in `docs/` — especially `docs/project-context.md` for a high-level overview.
