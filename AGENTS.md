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
- **State** — Zustand for global state (sidebar, toast, upgrade-modal)
- **DRY First + SOLID (CRITICAL)** — Never create new components/hooks/utils without: (1) searching existing code first (skill: `dry-enforcement`), (2) applying SOLID — SRP, OCP, LSP, ISP, DIP. Cada componente/hook deve ter uma única responsabilidade, ser extensível por composição, depender de abstrações (props), e nunca forçar dependências desnecessárias.
- **Shared hooks priorizados** — `useApi`, `useCrudActions` para data fetching e CRUD; `useBodyScrollLock`, `useFocusTrap`, `useKeyboardShortcuts` para UI; nunca duplicar padrões de loading/error/data

## Architecture
```
src/
  app/
    (auth)/            login, register, forgot/reset-password
    (dashboard)/       main app: Sidebar + Header + UpgradeModal + Toast
      dashboard/       metrics via Recharts
      cases/[id]/      case detail with tabs + drawers + FAB
      clients/         list + kanban
      calendar/        90-day calendar view + Google Calendar sync
      reports/         BI reports
      settings/        user settings
    admin/             admin panel
    portal/            client portal
    api/               all API routes
  components/
    ui/                primitives: Button, Badge, Input, Modal, Drawer, Card,
                       Spinner, PageHeader, PageError, AlertBanner,
                       EmptyState, ActionsDropdown, ConfirmDialog, etc.
    case/              CaseNotesDrawer, CaseChecklistDrawer, CaseOpinionsDrawer,
                       CaseBpcDrawer, CasePeticaoModal, CaseFloatingActions,
                       DrawerRedirect, ModalitySelect
    client/            ClientFloatingActions, ClientFormPage, DeleteClientModal
    dashboard/         dashboard widgets (KPI Grid, Charts, Deadlines, Pipeline)
    reports/           BI chart components
    bpc/               BpcForm, BpcResult, BpcSocialInterview
    pdf/               BpcPDFDocument, BpcConsolidatedPDFDocument, ComparePDFDocument
    onboarding/        OnboardingWizard, OnboardingChecklist
  hooks/               useApi, useCrudActions, useBodyScrollLock, useFocusTrap,
                       useKeyboardShortcuts, useUrgentDeadlines
  lib/                 shared logic: prisma, redis, engines, prompts, sanitize,
                       api-error (+ extractApiError), utils (+ formatPercentage),
                       modalidade-labels (+ getModalityLabel)
  services/            external integrations: CNIS, Mercado Pago, etc.
  jobs/                BullMQ workers
  store/               Zustand stores (sidebar, toast, upgrade-modal)
  types/               TS type declarations
prisma/schema.prisma — 821 lines, 25+ models
docs/*.md             — 18 comprehensive documentation files
```

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
