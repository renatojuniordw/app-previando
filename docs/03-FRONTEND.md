# 03 — FRONTEND
> UI, Navegação, Drawers, Padrões de código, Performance
> Última atualização: 2026-07-03

---

## Princípios

- Design System: Premium Legal Design (ver `11-DESIGN-SYSTEM.md`)
- Nunca chamar banco diretamente — só via API Routes (`/api/*`)
- Interceptar `402` globalmente no axios interceptor → abre `UpgradeModal` automaticamente
- Barra de uso (`UsageBar`) sempre visível no footer da sidebar
- Features bloqueadas: ícone Lock + tooltip + opacidade reduzida
- Labels em português (não uppercase)
- Ícones Lucide React (não emojis)
- **DRY + SOLID**: Buscar componentes/hooks existentes antes de criar novos
- **useApi/useCrudActions**: Preferir hooks compartilhados para data fetching e CRUD

---

## Stack

- **Framework:** Next.js 14 (App Router, Server/Client Components)
- **UI:** Tailwind CSS, Radix UI primitives
- **Fontes:** Inter (sans), Playfair Display (serif), JetBrains Mono (mono)
- **State:** Zustand (sidebar, upgrade-modal, toast)
- **HTTP:** Axios com interceptores (402 → upgrade modal)
- **Auth:** NextAuth.js (SessionProvider no layout do dashboard)
- **Ícones:** Lucide React
- **Gráficos:** Recharts (dynamic import)
- **Markdown:** react-markdown
- **Formulários:** react-hook-form + zod
- **PDF:** @react-pdf/renderer (dynamic import, ssr: false)

---

## Estrutura de Rotas

```
/(auth)                          ← Layout split-panel (branding left, form right)
├── /login                       ← Login
├── /register                    ← Cadastro
├── /forgot-password             ← Esqueci senha
└── /reset-password              ← Redefinir senha

/(dashboard)                    ← Layout com Sidebar + Header + UpgradeModal + ToastContainer
├── /                           ← redirect → /dashboard
├── /dashboard                  ← Métricas com recharts (BarChart, PieChart, RMI stats)
├── /calendar                   ← Calendário unificado (prazos, eventos Google, prescrições)
├── /deadlines                  ← Prazos dos próximos 30 dias
├── /activity                   ← Log de atividades paginado (AuditLog)
├── /reports                    ← BI reports (KPI cards, charts, funil)
├── /cases                      ← Busca global de casos com filtros avançados
├── /clients
│   ├── /list                   ← TODOS os clientes
│   │   └── /[id]              ← Perfil + casos do cliente
│   └── /kanban                 ← Kanban de casos (dnd-kit)
├── /cases/[id]                 ← Layout do caso (header + tabs + drawers + FAB)
│   ├── /                       ← Visão Geral (tab)
│   ├── /cnis                   ← Análise CNIS (tab)
│   ├── /calculator             ← Cálculos (tab)
│   ├── /simulator              ← Simulação (tab, plano)
│   ├── /retroativos            ← Retroativos (tab, plano)
│   ├── /compare                ← Comparar (tab)
│   ├── /gps                    ← Guias GPS (tab)
│   ├── /revisao                ← Revisão de benefício (tab, plano)
│   ├── /honorarios             ← Honorários (tab)
│   ├── /prescricao             ← Prescrição (tab)
│   ├── /timeline               ← Timeline do caso (tab)
│   ├── /notes                  ← Prontuário (rota legacy → redirect)
│   ├── /checklist              ← Checklist (rota legacy → redirect)
│   ├── /opinions               ← Pareceres IA (rota legacy → redirect)
│   ├── /bpc                    ← BPC/LOAS (aba condicional, só BPC_LOAS)
│   └── /pdf                    ← Visualização de PDF
├── /tools
│   ├── /pdf                    ← Ferramenta PDF
│   └── /cnis-indicators        ← Dicionário de indicadores CNIS
└── /settings
    ├── /profile                ← Configurações de perfil
    └── /billing                ← Gerenciamento de plano/faturamento

/admin                          ← Layout admin (sidebar escura + header, isAdmin guard)
├── /                           ← redirect → /admin/dashboard
├── /admin/dashboard            ← KPIs
├── /admin/users                ← Gestão de usuários
├── /admin/payments             ← Pagamentos
├── /admin/metrics              ← Métricas detalhadas
├── /admin/plans                ← Configuração de planos
├── /admin/modalidades          ← Modalidades CRUD
├── /admin/regras-aposentadoria ← Regras previdenciárias CRUD
└── /admin/salario-minimo       ← Tabela salário mínimo histórico
```

---

## Layouts

### Root (`src/app/layout.tsx`)
- Fontes: Inter, Playfair Display, JetBrains Mono (via `next/font`)
- Metadata + OpenGraph
- `lang="pt-BR"`
- MuiThemeProvider removido → movido para dashboard layout

### Auth — Split-Panel (`src/app/(auth)/layout.tsx`)
- Desktop: painel esquerdo (branding, slogan, gradiente) + direito (formulário)
- Mobile: logo compacto + formulário centralizado

### Dashboard (`src/app/(dashboard)/layout.tsx`)
- `SessionProvider` com sessão NextAuth
- Guard: `redirect('/login')` se sem sessão
- `MuiThemeProvider` (apenas dashboard, não no root)
- Estrutura: `Sidebar` + `Header` + `<main>` + `UpgradeModal` + `ToastContainer`
- Background: `bg-slate-50`

### Caso (`src/app/(dashboard)/cases/[id]/layout.tsx`)
- Header com breadcrumbs, status badges, priority badges
- Tabs de navegação horizontal (com `prefetch={false}` para tabs bloqueadas)
- Área de conteúdo (`max-w-7xl`)
- Drawers (notes, checklist, opinions, bpc) — **dynamic imports** com `ssr: false`
- FAB (Floating Action Button) para acesso rápido

### Admin (`src/app/admin/layout.tsx`)
- Sidebar escura (`bg-slate-900`)
- Guard: `isAdmin` session check

---

## Tabs de Navegação do Caso

| Tab | Rota | Ícone | Plano |
|-----|------|-------|-------|
| Visão Geral | `` | LayoutDashboard | Todos |
| Análise CNIS | `/cnis` | FileText | Todos |
| Cálculos | `/calculator` | Calculator | Todos |
| Simulação | `/simulator` | BarChart3 | SOLO/PRO |
| Retroativos | `/retroativos` | History | SOLO/PRO |
| Comparar | `/compare` | GitCompareArrows | Todos |
| BPC/LOAS | `/bpc` | Building2 | SOLO/PRO (só BPC_LOAS) |

**Regras:**
- BPC tab: adicionada condicionalmente quando `benefitType === 'BPC_LOAS'`
- Tab bloqueada: `cursor-not-allowed opacity-60` + Lock + tooltip
- Drawers (Notes, Checklist, Opinions) não são tabs — são painéis laterais

---

## Padrão Drawer (Painéis Laterais)

| Componente | Arquivo | Drawer ID |
|---|---|---|
| `CaseNotesDrawer` | `src/components/case/CaseNotesDrawer.tsx` | `notes` |
| `CaseChecklistDrawer` | `src/components/case/CaseChecklistDrawer.tsx` | `checklist` |
| `CaseOpinionsDrawer` | `src/components/case/CaseOpinionsDrawer.tsx` | `opinions` |
| `CaseBpcDrawer` | `src/components/case/CaseBpcDrawer.tsx` | `bpc` |

### Ativação via Query Param
```
?drawer=notes      → Prontuário
?drawer=checklist  → Checklist
?drawer=opinions   → Pareceres IA
?drawer=bpc        → Análise BPC (só BPC_LOAS)
```

### DrawerRedirect
Rota legacy `/notes`, `/checklist`, `/opinions` redirecionam para `?drawer=` via `DrawerRedirect.tsx`.

### CaseFloatingActions (FAB)
- Speed dial fixo canto inferior direito
- Botão principal: Briefcase (amber)
- Ações: Prontuário, Checklist, Parecer IA, BPC (condicional)

---

## Sidebar (`src/components/Sidebar.tsx`)

### Navegação
| Rota | Label | Ícone |
|------|-------|-------|
| `/dashboard` | Dashboard | LayoutDashboard |
| `/clients/list` | Clientes | Users |
| `/clients/kanban` | Kanban | Columns |
| `/cases` | Casos | FolderOpen |
| `/reports` | Relatórios | BarChart3 |
| `/calendar` | Calendário | CalendarDays |
| `/deadlines` | Prazos | Calendar |
| `/activity` | Atividade | Activity |
| `/tools/pdf` | Ferramentas de PDF | Files |
| `/tools/cnis-indicators` | Dicionário CNIS | BookOpen |
| `/settings/billing` | Plano | CreditCard |
| `/settings/profile` | Perfil | Settings |

### Footer
- `UsageBar` — consumo do plano
- Botão "Sair da Conta"

---

## Header (`src/components/Header.tsx`)

### Elementos
- **Hamburger** (Menu): toggle sidebar
- **Busca global**: placeholder "Pesquisar casos, clientes..."
- **Notificações** (Bell): polling 60s, badge vermelho, mark as read
- **Perfil**: nome + avatar (inicial em círculo amber)

---

## Stores (Zustand)

| Store | Arquivo | Persistência |
|---|---|---|
| `useSidebarStore` | `src/store/sidebar.ts` | `isDesktopOpen` (localStorage) |
| `useUpgradeModal` | `src/store/upgrade-modal.ts` | Não |
| `useToast` | `src/store/toast.ts` | Não |

---

## Componentes

### UI Base (`src/components/ui/`)
| Componente | Descrição |
|---|---|
| `Button.tsx` | primary, outline, danger, ghost + sm/md/lg |
| `Badge.tsx` | Badge colorido |
| `Input.tsx` | Input padronizado |
| `Modal.tsx` | Modal com backdrop |
| `Drawer.tsx` | Painel deslizante |
| `Card.tsx` | Card de dados |
| `ActionsDropdown.tsx` | Dropdown de ações |
| `ConfirmDialog.tsx` | Diálogo de confirmação (danger/warning/info) |
| `Spinner.tsx` | Spinner de carregamento (sm/md/lg) |
| `PageHeader.tsx` | Cabeçalho padronizado de página |
| `PageError.tsx` | Estado de erro com reset |
| `AlertBanner.tsx` | Banner de alerta (warning/error/success/info) |
| `EmptyState.tsx` | Estado vazio com ícone, título, descrição, ação |
| `CurrencyInput.tsx` | Input monetário |
| `DatePicker.tsx` | Seletor de data (MUI) |
| `MonthPicker.tsx` | Seletor de mês |
| `Skeleton.tsx` | Skeleton loading (DetailSkeleton, CardSkeleton, TableSkeleton) |
| `HelpText.tsx` | Texto de ajuda contextual |
| `MuiThemeProvider.tsx` | Provider MUI (apenas dashboard) |
| `Tooltip.tsx` | Tooltip customizado |

### Caso (`src/components/case/`)
| Componente | Descrição |
|---|---|
| `CaseNotesDrawer` | Prontuário (imutável) |
| `CaseChecklistDrawer` | Checklist |
| `CaseOpinionsDrawer` | Pareceres IA |
| `CaseBpcDrawer` | Análise BPC |
| `CaseFloatingActions` | FAB speed dial |
| `CasePeticaoModal` | Modal de petição |
| `DrawerRedirect` | Redireciona rotas legacy para ?drawer= |
| `ModalitySelect` | Seletor de modalidade |

### BPC (`src/components/bpc/`)
| Componente | Descrição |
|---|---|
| `BpcForm.tsx` | Formulário de dados (patologia, renda, etc.) |
| `BpcResult.tsx` | Resultado com tabs (Pré-Análise, Laudo, Social, Médico, Checklist) |
| `BpcSocialInterview.tsx` | Entrevistador social interativo por domínios CIF |

### Dashboard (`src/components/dashboard/`)
| Componente | Descrição |
|---|---|
| `DashboardKpiGrid` | KPIs principais |
| `DashboardDeadlines` | Prazos próximos |
| `DashboardPipeline` | Pipeline de casos |
| `DashboardCharts` | Gráficos (Recharts) |
| `DashboardActivityFeed` | Feed de atividade |
| `DashboardQuickActions` | Ações rápidas |
| `OnboardingBanner` | Banner de onboarding |

### PDF (`src/components/pdf/`)
| Componente | Descrição |
|---|---|
| `BpcPDFDocument.tsx` | PDF BPC (@react-pdf) |
| `ComparePDFDocument.tsx` | PDF comparativo |
| `BpcConsolidatedPDFDocument.tsx` | PDF consolidado BPC |
| `styles.ts` | Estilos compartilhados PDF |

### Obsoletos/Removidos
| Componente | Motivo |
|---|---|
| `CasePDFDocument.tsx` | Nunca utilizado |
| `BpcLaudoModal.tsx` | Nunca utilizado |
| `BpcFormSection.tsx` | Nunca utilizado |
| `ContextualTooltip.tsx` | Nunca utilizado |

---

## Hooks

| Hook | Arquivo | Descrição |
|---|---|---|
| `useApi` | `src/hooks/useApi.ts` | Data fetching genérico com loading/error/data + AbortController |
| `useCrudActions` | `src/hooks/useCrudActions.ts` | create/update/remove com loading state + toast |
| `useBodyScrollLock` | `src/hooks/useBodyScrollLock.ts` | Bloqueia scroll |
| `useFocusTrap` | `src/hooks/useFocusTrap.ts` | Focus trap para modais/drawers |
| `useKeyboardShortcuts` | `src/hooks/useKeyboardShortcuts.ts` | Atalhos de teclado |
| `useUrgentDeadlines` | `src/hooks/useUrgentDeadlines.ts` | Prazos urgentes |

---

## API Client (`src/lib/api.ts`)

- Axios com `baseURL: '/api'`
- Interceptor: `402` → abre `UpgradeModal`
- Dados do erro: `{ error, feature, upgradeRequired }`

---

## Error Handling

### `handleApiError` (server-side)
Usado em todas as API Routes. Trata `NotFoundError`, `ForbiddenError`, `ValidationError`, `PlanLimitError`.

### `extractApiError` (client-side)
Extrai mensagem de erro de respostas axios, com fallback:
```ts
extractApiError(err, 'Mensagem padrão')
```

### `useCrudActions`
Hook que já integra chamada API + toast de sucesso/erro:
```ts
const { create, update, remove, loading } = useCrudActions('/api/cases', {
  successMessage: 'Caso criado.',
  onSuccess: refetch,
})
```

---

## Performance

### Dynamic Imports
| Componente | Técnica | Motivo |
|---|---|---|
| `DashboardKpiGrid` | `next/dynamic` | Recharts pesado |
| `DashboardCharts` | `next/dynamic` | Recharts pesado |
| `DashboardPipeline` | `next/dynamic` | Recharts pesado |
| `DashboardDeadlines` | `next/dynamic` | Recharts pesado |
| `DashboardActivityFeed` | `next/dynamic` | Reduz bundle inicial |
| `CaseNotesDrawer` | `next/dynamic` + ssr:false | Só abre sob demanda |
| `CaseChecklistDrawer` | `next/dynamic` + ssr:false | Só abre sob demanda |
| `CaseOpinionsDrawer` | `next/dynamic` + ssr:false | Só abre sob demanda |
| `CaseBpcDrawer` | `next/dynamic` + ssr:false | Só abre sob demanda |
| `CasePeticaoModal` | `next/dynamic` + ssr:false | Só abre sob demanda |
| `BpcResult` | `next/dynamic` + ssr:false | react-markdown |
| `BpcConsolidatedPDFDocument` | `next/dynamic` + ssr:false | @react-pdf (~140KB) |
| `ComparePDFDocument` | `next/dynamic` + ssr:false | @react-pdf (~140KB) |
| `ReportBarChart` | `next/dynamic` | Recharts (~80KB) |
| `ReportPieChart` | `next/dynamic` | Recharts (~80KB) |
| `ReportHorizontalBar` | `next/dynamic` | Recharts (~80KB) |
| `ConversionFunnel` | `next/dynamic` | Recharts (~80KB) |

### React.memo
Componentes persistentes memoizados: `Header`, `Sidebar`, todos os widgets de dashboard, todos os componentes de reports.

### Prefetch
- Sidebar: `prefetch={false}` em todos os links
- Case tabs: `prefetch={false}` em tabs bloqueadas por plano
- Notification dropdown: `prefetch={false}`
