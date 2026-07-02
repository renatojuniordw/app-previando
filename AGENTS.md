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

## Architecture
```
src/
  app/
    (auth)/          login, register, forgot/reset-password
    (dashboard)/     main app: Sidebar + Header + UpgradeModal + Toast
      dashboard/     metrics via Recharts
      cases/[id]/    case detail with tabs + drawers + FAB
      clients/       list + kanban
      calendar/      unified 90-day calendar + Google Calendar sync
      reports/       BI reports
      settings/      user settings
      admin/         admin panel
      portal/        client portal
    api/             all API routes
  components/
    ui/              Radix-based primitives
    case/            case-specific components
    client/          client-specific components
    dashboard/       dashboard widgets
    reports/         BI chart components
  lib/               shared logic: prisma, redis, engines, prompts
  services/          external integrations: CNIS, Mercado Pago, Clicksign, etc.
  jobs/              BullMQ workers
  store/             Zustand stores
  types/             TS type declarations
prisma/schema.prisma — 821 lines, 25+ models
docs/*.md           — 17 comprehensive documentation files
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
