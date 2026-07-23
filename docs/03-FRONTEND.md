# 03 — FRONTEND
> UI, Navegação, Drawers, Padrões de código, Performance, Acessibilidade, PWA
> Última atualização: 2026-07-22

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
- **Acessibilidade**: ARIA roles, focus trap, contraste WCAG
- **PWA**: manifest.json, service worker, ícones

---

## Stack

- **Framework:** Next.js 14 (App Router, Server/Client Components)
- **UI:** Tailwind CSS, Radix UI primitives
- **Fontes:** Inter (sans), Playfair Display (serif), JetBrains Mono (mono)
- **State:** Zustand (sidebar, upgrade-modal, toast, admin-sidebar, recent-store, search-store)
- **HTTP:** Axios com interceptores (402 → upgrade modal)
- **Auth:** NextAuth.js (SessionProvider no layout do dashboard)
- **Ícones:** Lucide React
- **Gráficos:** Recharts (dynamic import)
- **Markdown:** react-markdown
- **Formulários:** react-hook-form + zod
- **PDF:** @react-pdf/renderer (dynamic import, ssr: false)
- **Testes E2E:** Playwright

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
│   ├── /scenarios              ← Cenários de simulação (nova rota)
│   ├── /bpc                    ← BPC/LOAS (aba condicional, só BPC_LOAS)
│   └── /pdf                    ← Visualização de PDF
├── /cases/import               ← Importação de casos via CSV (nova rota)
├── /tools
│   ├── /pdf                    ← Ferramenta PDF
│   └── /cnis-indicators        ← Dicionário de indicadores CNIS
└── /settings
    ├── /profile                ← Configurações de perfil
    └── /billing                ← Gerenciamento de plano/faturamento

/suporte                   ← Página de suporte/chamados
/honorarios                ← Gestão de honorários
/tools
├── /tools/pdf                    ← Ferramenta PDF
└── /tools/cnis-indicators        ← Dicionário de indicadores CNIS
/settings
├── /settings/profile             ← Configurações de perfil
└── /settings/billing             ← Gerenciamento de plano/faturamento

/(public)                   ← Páginas públicas (privacidade, termos)

/admin                          ← Layout admin (sidebar escura + header, isAdmin guard)
├── /                           ← redirect → /admin/dashboard
├── /dashboard                  ← KPIs
├── /users                      ← Gestão de usuários
├── /payments                   ← Pagamentos
├── /metrics                    ← Métricas detalhadas
├── /plans                      ← Configuração de planos
├── /modalidades                ← Modalidades CRUD
├── /regras-aposentadoria       ← Regras previdenciárias CRUD
├── /salario-minimo             ← Tabela salário mínimo histórico
└── /suporte                    ← Gestão de chamados de suporte
```

---

## Layouts

### Root (`src/app/layout.tsx`)
- Fontes: Inter, Playfair Display, JetBrains Mono (via `next/font`)
- Metadata + OpenGraph
- `lang="pt-BR"`
- MuiThemeProvider removido → movido para dashboard layout
- PWA: manifest.json link, service worker registration

### Auth — Split-Panel (`src/app/(auth)/layout.tsx`)
- Desktop: painel esquerdo (branding, slogan, gradiente) + direito (formulário)
- Mobile: logo compacto + formulário centralizado
- Componentes: `AuthHighlights`, `AuthMobileValue`, `AuthTransition`, `CookieConsent`

### Dashboard (`src/app/(dashboard)/layout.tsx`)
- `SessionProvider` com sessão NextAuth
- Guard: `redirect('/login')` se sem sessão
- `MuiThemeProvider` (apenas dashboard, não no root)
- Estrutura: `Sidebar` + `Header` + `<main>` + `UpgradeModal` + `ToastContainer` + `ErrorBoundary`
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

## Sidebar Refatorada (SRP)

O componente `Sidebar.tsx` foi refatorado para delegar responsabilidades a 3 subcomponentes:

### Subcomponentes
| Componente | Arquivo | Responsabilidade |
|---|---|---|
| `SidebarNav` | `src/components/sidebar/SidebarNav.tsx` | Navegação principal (links, ícones, labels) |
| `SidebarUserInfo` | `src/components/sidebar/SidebarUserInfo.tsx` | Avatar, nome, plano do usuário |
| `SidebarRecentItems` | `src/components/sidebar/SidebarRecentItems.tsx` | Itens visitados recentemente |

### Navegação (SidebarNav)
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

## Header Refatorado (SRP)

O componente `Header.tsx` foi refatorado para delegar responsabilidades a 3 subcomponentes:

### Subcomponentes
| Componente | Arquivo | Responsabilidade |
|---|---|---|
| `NotificationDropdown` | `src/components/header/NotificationDropdown.tsx` | Sininho de notificações com badge + dropdown |
| `MobileSearchOverlay` | `src/components/header/MobileSearchOverlay.tsx` | Overlay de busca para mobile |
| `UserProfileButton` | `src/components/header/UserProfileButton.tsx` | Avatar + nome + dropdown de perfil |

### Elementos do Header
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
| `useAdminSidebar` | `src/store/admin-sidebar.ts` | Não |
| `useRecentStore` | `src/store/recent-store.ts` | localStorage |
| `useSearchStore` | `src/store/search-store.ts` | Não |

---

## Componentes

### UI Base (`src/components/ui/`)

**30 primitivas:**

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
| `FloatingActionMenu.tsx` | Menu de ações flutuante (compartilhado entre Case/Client) |
| `ContextualEmptyState.tsx` | Estado vazio contextual com ação inteligente |
| `ProgressBar.tsx` | Barra de progresso reutilizável |
| `CurrencyInput.tsx` | Input monetário |
| `DatePicker.tsx` | Seletor de data (MUI) |
| `MonthPicker.tsx` | Seletor de mês |
| `Skeleton.tsx` | Skeleton loading (DetailSkeleton, CardSkeleton, TableSkeleton) |
| `HelpText.tsx` | Texto de ajuda contextual |
| `MuiThemeProvider.tsx` | Provider MUI (apenas dashboard) |
| `Tooltip.tsx` | Tooltip customizado |
| `BottomSheet.tsx` | Bottom sheet mobile (gestão por toque) |
| `FilterSheet.tsx` | Painel de filtros deslizante |
| `MobileBottomNav.tsx` | Navegação inferior mobile (5 itens) |
| `QuickActionSheet.tsx` | Ações rápidas em sheet |
| `Select.tsx` | Select dropdown padronizado |
| `Popover.tsx` | Popover contextual |
| `MobileCardList.tsx` | Lista de cards otimizada para mobile |

### Sidebar Subcomponentes

| Componente | Descrição |
|---|---|
| `SidebarNav` | Navegação principal (SRP) |
| `SidebarUserInfo` | Info do usuário (SRP) |
| `SidebarRecentItems` | Itens recentes (SRP) |

### Header Subcomponentes

| Componente | Descrição |
|---|---|
| `NotificationDropdown` | Dropdown de notificações (SRP) |
| `MobileSearchOverlay` | Busca mobile overlay (SRP) |
| `UserProfileButton` | Botão de perfil (SRP) |

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
| `ProcessTimeline` | Timeline processual |

### BPC (`src/components/bpc/`) — 5 componentes
| Componente | Descrição |
|---|---|
| `BpcForm.tsx` | Formulário de dados (patologia, renda, etc.) |
| `BpcResult.tsx` | Resultado com tabs (Pré-Análise, Laudo, Social, Médico, Checklist) |
| `BpcSocialInterview.tsx` | Entrevistador social interativo por domínios CIF |
| `BpcFormSection.tsx` | Seção colapsável do formulário BPC |
| `BpcLaudoModal.tsx` | Modal de upload/visualização de laudos |

### Dashboard (`src/components/dashboard/`) — 7 componentes
| Componente | Descrição |
|---|---|
| `DashboardKpiGrid` | KPIs principais |
| `DashboardDeadlines` | Prazos próximos |
| `DashboardPipeline` | Pipeline de casos |
| `DashboardCharts` | Gráficos (Recharts) |
| `DashboardActivityFeed` | Feed de atividade |
| `DashboardQuickActions` | Ações rápidas |
| `OnboardingBanner` | Banner de onboarding |

### PDF (`src/components/pdf/`) — 5 componentes
| Componente | Descrição |
|---|---|
| `BpcPDFDocument.tsx` | PDF BPC (@react-pdf) |
| `ComparePDFDocument.tsx` | PDF comparativo |
| `BpcConsolidatedPDFDocument.tsx` | PDF consolidado BPC |
| `CasePDFDocument.tsx` | PDF genérico de caso |
| `styles.ts` | Estilos compartilhados PDF |

### Obsoletos/Removidos
| Componente | Motivo |
|---|---|
| `CasePDFDocument.tsx` | Nunca utilizado |
| `BpcConsolidatedPDFDocument` (dynamic import) | Dead import — página gera PDF via API, não via componente frontend |
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
| `useUrgentDeadlines` | `src/hooks/useUrgentDeadlines.ts` | Prazos urgentes (7 dias) |
| `useCepLookup` | `src/hooks/useCepLookup.ts` | Busca automática de CEP com debounce |
| `useClientDetail` | `src/hooks/useClientDetail.ts` | Hook de detalhe do cliente com refetch |
| `useCnis` | `src/hooks/useCnis.ts` | Gerenciamento de CNIS do caso |
| `useCnisUpload` | `src/hooks/useCnisUpload.ts` | Upload de CNIS com progresso |
| `usePollingCount` | `src/hooks/usePollingCount.ts` | Polling de contagens com AbortController + mounted check (substitui `useClientCount` e `usePendingCasesCount`) |

### usePollingCount
```typescript
// Substitui os hooks especializados useClientCount e usePendingCasesCount
// Implementação genérica com:
// - AbortController para cancelamento em unmount
// - mounted check para evitar setState após desmontagem
// - Intervalo configurável (default 30s)
// - Retry automático em caso de falha
function usePollingCount(url: string, interval?: number): { count: number; loading: boolean }
```

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

### `ErrorBoundary`
- Componente `ErrorBoundary.tsx` com `componentDidCatch`
- Integração com Sentry para captura de erros não tratados
- UI de fallback com botão "Tentar novamente"

---

## Acessibilidade

### Implementado
- **ARIA roles**: `role="checkbox"`, `aria-checked` nos checkboxes customizados
- **BottomSheet**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Focus trap**: `useFocusTrap(ref, active)` em modais, drawers e BottomSheet
- **Contraste**: Paleta slate/amber verifica contraste WCAG AA
- **Labels**: `aria-label` em botões de ícone, `aria-describedby` em inputs
- **Teclado**: Navegação por Tab, Escape para fechar modais

### Conformidade
- WCAG 2.1 AA (alvo)
- Contraste mínimo 4.5:1 em textos normais
- Foco visível em todos os elementos interativos

---

## PWA

### Manifest
- `manifest.json` com:
  - `name`: "Previando"
  - `short_name`: "Previando"
  - `start_url`: "/dashboard"
  - `display`: "standalone"
  - `background_color`: "#f8fafc" (slate-50)
  - `theme_color`: "#d97706" (amber-600)
  - `icons`: 192x192 e 512x512

### Service Worker
- Cache offline parcial de assets estáticos
- Estratégia: Cache-first para fontes e CSS, Network-first para dados
- Registrado no layout raiz

### Ícones
- Ícones PWA gerados (192x192, 512x512)
- Favicon tradicional mantido

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

### Mobile Optimization
- BottomNav: 5 itens (Início, Clientes, Casos, Calendário, Mais)
- Sidebar responsiva: labels visíveis no mobile, ocultas em desktop collapsed
- Modal: `flex-1 min-h-0` no conteúdo para scroll em mobile
- FAB: labels visíveis no mobile, `z-[60]`
- Global search: Cmd+K desktop, botão de busca no mobile
- Bottom sheet: `BottomSheet` component para gestos de toque

---

## E2E (Playwright)

### Configuração
- **Arquivo:** `src/e2e/playwright.config.ts`
- **Spec files:** 3 arquivos:
  - `auth.setup.ts` — Setup de autenticação (login compartilhado)
  - `dashboard.spec.ts` — Testes do dashboard
  - `cases.spec.ts` — Testes de casos
  - `clients.spec.ts` — Testes de clientes

### Funcionalidades testadas
- Login/logout
- Criação e edição de casos
- Criação e edição de clientes
- Navegação pelo dashboard
- Upload e processamento CNIS
