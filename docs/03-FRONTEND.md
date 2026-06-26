# 03 — FRONTEND
> UI, Navegação, Drawers, Design System Premium Legal

---

## Princípios

- Design System: Premium Legal Design (ver `11-DESIGN-SYSTEM.md`)
- Nunca chamar banco diretamente — só via API Routes (`/api/*`)
- Interceptar `402` globalmente no axios interceptor → abre `UpgradeModal` automaticamente
- Barra de uso (`UsageBar`) sempre visível no footer da sidebar
- Features bloqueadas: ícone Lock + tooltip "Recurso bloqueado no seu plano" + opacidade reduzida
- Empty states claros com ação contextual
- Labels em português (não uppercase)
- Ícones Lucide React (não emojis)

---

## Stack

- **Framework:** Next.js 15 (App Router, Server/Client Components)
- **UI:** Tailwind CSS, Radix UI primitives
- **Fontes:** Inter (sans), Playfair Display (serif), JetBrains Mono (mono)
- **State:** Zustand (sidebar, upgrade-modal, toast)
- **HTTP:** Axios com interceptores (402 → upgrade modal)
- **Auth:** NextAuth.js (SessionProvider no layout do dashboard)
- **Ícones:** Lucide React

---

## Estrutura de Rotas

```
/(auth)                          ← Layout split-panel (branding left, form right)
├── /login
└── /register

/(dashboard)                    ← Layout com Sidebar + Header + UpgradeModal + ToastContainer
├── /                           ← redirect → /dashboard
├── /dashboard                  ← Métricas com recharts (BarChart, PieChart, RMI stats)
├── /deadlines                  ← Prazos dos próximos 30 dias
├── /activity                   ← Log de atividades paginado (AuditLog)
├── /cases                      ← Busca global de casos com filtros avançados
├── /clients
│   ├── /list                   ← TODOS os clientes
│   │   └── /[id]              ← Perfil + casos do cliente
│   └── /kanban                 ← Kanban de casos
├── /cases/[id]                 ← Layout do caso (header + tabs + drawers + FAB)
│   ├── /                       ← Visão Geral (tab)
│   ├── /cnis                   ← Análise CNIS (tab)
│   ├── /calculator             ← Cálculos (tab)
│   ├── /simulator              ← Simulação (tab, bloqueado por plano)
│   ├── /retroativos            ← Retroativos (tab, bloqueado por plano)
│   ├── /compare                ← Comparar (tab)
│   ├── /notes                  ← Prontuário (rota legacy, drawer via ?drawer=notes)
│   ├── /checklist              ← Checklist (rota legacy, drawer via ?drawer=checklist)
│   ├── /opinions               ← Pareceres IA (rota legacy, drawer via ?drawer=opinions)
│   └── /bpc                    ← BPC/LOAS (tab condicional + drawer, só BPC_LOAS)
├── /tools
│   └── /social-media           ← Gerador de carrossel Instagram BPC
└── /settings
    ├── /profile                ← Configurações de perfil
    └── /billing                ← Gerenciamento de plano/faturamento

/admin                          ← Layout admin (sidebar escura + header, isAdmin guard)
├── /admin                      ← redirect → /admin/dashboard
├── /admin/dashboard            ← Dashboard administrativo
├── /admin/users                ← Gerenciamento de usuários
├── /admin/payments             ← Pagamentos
├── /admin/metrics              ← Métricas do sistema
├── /admin/plans                ← Configuração de planos
├── /admin/modalidades          ← Modalidades de benefício
├── /admin/regras-aposentadoria ← Regras previdenciárias
└── /admin/salario-minimo       ← Tabela salário mínimo histórico
```

---

## Layouts

### Root (`src/app/layout.tsx`)
- Fontes: Inter, Playfair Display, JetBrains Mono
- Metadata: título, descrição, OpenGraph
- `lang="pt-BR"`

### Auth — Split-Panel (`src/app/(auth)/layout.tsx`)
- **Desktop:** painel esquerdo (branding, slogan, gradiente) + painel direito (formulário)
- **Mobile:** logo compacto + formulário centralizado
- Responsivo: `md:flex-row` para split, empilha em mobile

### Dashboard (`src/app/(dashboard)/layout.tsx`)
- `SessionProvider` com sessão do NextAuth
- Guard: `redirect('/login')` se sem sessão
- Estrutura: `Sidebar` + `Header` + `<main>` com `id="main-content"` e `tabIndex={-1}`
- Globais: `UpgradeModal` + `ToastContainer`
- Background: `bg-slate-50`

### Caso (`src/app/(dashboard)/cases/[id]/layout.tsx`)
- Header com breadcrumbs (link para cliente), status badges, priority badges
- Tabs de navegação horizontal com scroll
- Área de conteúdo (`max-w-7xl`)
- Drawers de slide-out (notes, checklist, opinions, bpc)
- FAB (Floating Action Button) para acesso rápido aos drawers
- Dados do caso via `GET /api/cases/:id` (client-side)

### Admin (`src/app/admin/layout.tsx`)
- Sidebar escura (`bg-slate-900`) com navegação interna
- Header com "Administração" + avatar "AD"
- Guard: `redirect('/login')` se sem sessão, `redirect('/dashboard')` se não isAdmin
- Link "Voltar ao App" → `/dashboard`

---

## Tabs de Navegação do Caso

As tabs são definidas no `cases/[id]/layout.tsx` e renderizadas com scroll horizontal.

```tsx
const tabs = [
  { id: 'overview',    label: 'Visão Geral',  icon: LayoutDashboard,   path: '' },
  { id: 'cnis',        label: 'Análise CNIS', icon: FileText,          path: '/cnis' },
  { id: 'calculator',  label: 'Cálculos',     icon: Calculator,        path: '/calculator' },
  { id: 'simulator',   label: 'Simulação',    icon: BarChart3,        path: '/simulator',
    locked: !caseData.planLimits?.simulatorEnabled },
  { id: 'retroativos', label: 'Retroativos',  icon: History,          path: '/retroativos',
    locked: !caseData.planLimits?.retroativosEnabled },
  { id: 'compare',     label: 'Comparar',     icon: GitCompareArrows, path: '/compare' },
  // BPC/LOAS conditional:
  // { id: 'bpc', label: 'BPC/LOAS', icon: Building2, path: '/bpc',
  //   locked: !caseData.planLimits?.bpcEnabled },
]
```

**Regras de renderização:**
- Ícones Lucide React (não emojis)
- Labels em português (Sentence case, não uppercase)
- Tab ativa: `border-amber-500 text-amber-700 bg-amber-50/50`
- Tab bloqueada: `cursor-not-allowed opacity-60` + ícone Lock + `href="#"`
- Tab desativada: `text-slate-500 hover:text-slate-800`
- BPC tab: adicionada condicionalmente quando `benefitType === 'BPC_LOAS'`
- Bloqueio via `planLimits.simulatorEnabled`, `planLimits.retroativosEnabled`, `planLimits.bpcEnabled`

---

## Padrão Drawer (Painéis Laterais)

Notes (Prontuário), Checklist e Opinions (Parecer) **não são mais tabs** — são drawers (painéis deslizantes) controlados por query params.

### Componentes
| Componente | Arquivo | Drawer ID |
|---|---|---|
| `CaseNotesDrawer` | `src/components/case/CaseNotesDrawer.tsx` | `notes` |
| `CaseChecklistDrawer` | `src/components/case/CaseChecklistDrawer.tsx` | `checklist` |
| `CaseOpinionsDrawer` | `src/components/case/CaseOpinionsDrawer.tsx` | `opinions` |
| `CaseBpcDrawer` | `src/components/case/CaseBpcDrawer.tsx` | `bpc` |

### Ativação via Query Param
```
?drawer=notes      → abre Prontuário
?drawer=checklist  → abre Checklist
?drawer=opinions   → abre Pareceres IA
?drawer=bpc        → abre Análise BPC (só BPC_LOAS)
```

Sem `?drawer=` ou com valor removido → todos os drawers fechados.

### CaseFloatingActions (FAB)
- Componente: `src/components/case/CaseFloatingActions.tsx`
- Speed dial fixo no canto inferior direito (`bottom-6 right-6`)
- Botão principal: ícone Briefcase (amber) → expande menu
- Ações disponíveis: Prontuário (MessageSquare), Checklist (CheckSquare), Parecer IA (Bot)
- BPC (Building2) adicionado condicionalmente para casos BPC_LOAS
- Cada ação toggle o drawer correspondente via `setDrawer()`
- Tooltip com label aparece no hover
- Fecha ao clicar fora

### Drawer UI Component
- Base: `src/components/ui/Drawer.tsx` (Radix Sheet/Dialog)
- Props: `open`, `onClose`, `title`, `description`
- Renderiza conteúdo em painel deslizante com backdrop

---

## Sidebar (`src/components/Sidebar.tsx`)

### Comportamento
- **Desktop:** colapsável via `isDesktopOpen` (Zustand persist, `lg:w-64` ↔ `lg:w-0`)
- **Mobile:** drawer com overlay (`fixed inset-y-0 left-0 z-40`)
- Fecha automaticamente em mobile ao mudar de rota
- Fecha com tecla **Escape**
- Estado gerenciado por `useSidebarStore` (Zustand com persistência de `isDesktopOpen`)

### Navegação
```tsx
const NAV_ITEMS = [
  { href: '/dashboard',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/clients/list',       label: 'Clientes',   icon: Users },
  { href: '/clients/kanban',     label: 'Kanban',     icon: Columns },
  { href: '/cases',              label: 'Casos',      icon: FolderOpen },
  { href: '/deadlines',          label: 'Prazos',     icon: Calendar },
  { href: '/activity',           label: 'Atividade',  icon: Activity },
  { href: '/tools/social-media', label: 'Carrossel BPC', icon: Instagram },
  { href: '/settings/billing',   label: 'Plano',      icon: CreditCard },
  { href: '/settings/profile',   label: 'Perfil',     icon: Settings },
]
```

### Footer da Sidebar
- `UsageBar` — componente de consumo do plano (clientes, cálculos, análises BPC)
- Botão "Sair da Conta" (`signOut({ callbackUrl: '/login' })`) com ícone LogOut

### Logo
- "PREVI**ANDO**" (serif, tracking-tight) com "ANDO" em `text-amber-600`
- Subtítulo: "Previdência" (uppercase, tracking-widest)

---

## Header (`src/components/Header.tsx`)

### Elementos
- **Hamburger** (Menu): toggle sidebar (mobile → drawer, desktop → collapse)
- **Busca global**: input com placeholder "Pesquisar casos, clientes...", navega para `/cases?search=...`
- **Notificações** (Bell): dropdown com polling a cada 60s via `GET /api/notifications`
  - Suporte a notificações nativas do navegador
  - Badge vermelho com contador de não-lidas
  - Mark as read via `POST /api/notifications/:id/read`
  - Link para caso relacionado
- **Perfil do usuário**: nome + avatar (inicial em círculo amber)

### Notificações
- Interface `AppNotification`: `{ id, type, caseId, message, read, createdAt }`
- Dropdown com scroll (`max-h-72`)
- Fecha ao clicar fora (mousedown handler)

---

## ClientSwitcher (`src/components/ClientSwitcher.tsx`)

- Toggle entre "Lista de Clientes" (`/clients/list`) e "Kanban" (`/clients/kanban`)
- Pill navigation com `bg-slate-100` container
- Estado ativo: `bg-white text-slate-900 shadow-sm`
- Estado inativo: `text-slate-500 hover:text-slate-700`

---

## UpgradeModal (`src/components/UpgradeModal.tsx`)

### Gatilho
- Axios interceptor global captura `402 Payment Required`
- Abre automaticamente via Zustand `useUpgradeModal`

### Comportamento
- Modal fixo (`fixed inset-0 z-50`) com backdrop `bg-black/60 backdrop-blur-sm`
- Exibe badge "UPGRADE NECESSÁRIO" + plano requerido
- Botão "Ver Planos" → `router.push('/settings/billing')`
- Botão "Fechar" → fecha modal

### Store (`src/store/upgrade-modal.ts`)
```ts
interface UpgradeModalState {
  open: boolean
  message: string
  feature: string
  upgradeRequired: string
  openModal(params): void
  closeModal(): void
}
```

---

## UsageBar (`src/components/UsageBar.tsx`)

- Dados via `GET /api/usage`
- Renderizado no footer da sidebar
- **FREE:** mostra Clientes e Cálculos
- **SOLO com BPC:** mostra Análises BPC e Carrosséis
- **Outros planos:** não renderiza (ilimitado)
- Cores: amber (<80%), yellow (>=80%), red (>=100%)
- `max === -1` → item não renderizado (ilimitado)

---

## ToastContainer (`src/components/ToastContainer.tsx`)

- Toasts gerenciados via Zustand `useToast`
- Renderizado no DashboardLayout como global

---

## Stores (Zustand)

| Store | Arquivo | Persistência |
|---|---|---|
| `useSidebarStore` | `src/store/sidebar.ts` | `isDesktopOpen` via localStorage |
| `useUpgradeModal` | `src/store/upgrade-modal.ts` | Não |
| `useToast` | `src/store/toast.ts` | Não |

---

## API Client (`src/lib/api.ts`)

- Axios com `baseURL: '/api'`
- Interceptor de resposta: `402` → abre `UpgradeModal`
- Dados do interceptor: `{ error, feature, upgradeRequired }`

---

## Componentes de Drawer (`src/components/case/`)

| Arquivo | Descrição |
|---|---|
| `CaseNotesDrawer.tsx` | Prontuário: lista imutável de anotações (Contato, Documento, Jurídico, Interno, Cálculo, Pendência, BPC). Criação inline com alerta de imutabilidade. |
| `CaseChecklistDrawer.tsx` | Checklist do caso |
| `CaseOpinionsDrawer.tsx` | Pareceres gerados por IA |
| `CaseBpcDrawer.tsx` | Análise BPC (condicional BPC_LOAS) |
| `CaseFloatingActions.tsx` | FAB speed dial para abrir drawers rapidamente |

---

## Hooks Utilizados

| Hook | Arquivo | Descrição |
|---|---|---|
| `useBodyScrollLock` | `src/hooks/useBodyScrollLock.ts` | Bloqueia scroll do body quando drawer mobile está aberto |

---

## Observações de Migração (vs. doc anterior)

1. **Notes/Checklist/Opinions saíram das tabs** → agora são drawers com `?drawer=` query param
2. **BPC tab é condicional** → só aparece para `benefitType === 'BPC_LOAS'`
3. **Rota de cliente mudou** → de `/clients/[id]` para `/clients/list/[id]`
4. **Labels em português** → "Visão Geral", "Análise CNIS", "Cálculos", "Simulação", "Retroativos", "Comparar"
5. **Ícones Lucide React** → substituíram emojis nas tabs
6. **Sidebar colapsável** → `isDesktopOpen` state com persistência via Zustand
7. **FAB (Floating Action Button)** → acesso rápido aos drawers do caso
8. **Carrossel BPC** → nova rota `/tools/social-media` com ícone Instagram na sidebar
9. **Salário Mínimo** → nova rota admin `/admin/salario-minimo`
