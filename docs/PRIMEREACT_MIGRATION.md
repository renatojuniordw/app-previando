# PRIMEREACT MIGRATION — previando-app

> **Data da Análise:** 26 de junho de 2026
> **Versão do Projeto:** 0.1.0
> **Framework:** Next.js 14 + React 18 + Tailwind CSS 3.4

---

## 1. Diagnóstico Geral

### Visão do Projeto

O Previando é um SaaS jurídico previdenciário para advogados, com módulos de gestão de clientes, casos, cálculos de benefícios do INSS, análise CNIS com IA, BPC/LOAS, simuladores, pareceres com IA e administração.

### Métricas

| Métrica | Quantidade |
|---|---|
| **Total de rotas (page.tsx)** | 32 |
| **Total de componentes compartilhados** | 35 |
| **Total de páginas do admin** | 9 |
| **Rotas de autenticação** | 2 (login, register) |
| **Rotas do dashboard principal** | 20 |
| **Componentes de UI base** | 7 (Button, Input, Card, Badge, Modal, Drawer, ActionsDropdown) |
| **Componentes de domínio** | 16 (dashboard, bpc, case, client, cases) |
| **Componentes de layout** | 7 (Header, Sidebar, Toast, UpgradeModal, ErrorBoundary, ClientSwitcher, UsageBar) |
| **Componentes PDF** | 4 (não usam classes Tailwind) |

### Dependências a Remover (migração completa)

| Pacote | Uso Atual | Substituto PrimeReact |
|---|---|---|
| `tailwindcss` | Framework de estilos utilitários | Remover (após migração completa) |
| `@tailwindcss/typography` | Plugin prose para markdown | PrimeFlex typography |
| `autoprefixer` | PostCSS plugin | Manter até remoção final |
| `postcss` | PostCSS pipeline | Manter até remoção final |
| `prettier-plugin-tailwindcss` | Ordenação de classes | Remover |
| `clsx` | Utility para classes | Manter (compatível) |
| `tailwind-merge` | Merge de classes Tailwind | Remover (após migração completa) |

### Dependências a Adicionar

| Pacote | Versão Sugerida | Justificativa |
|---|---|---|
| `primereact` | ^10.x | Biblioteca de componentes UI |
| `primeicons` | ^7.x | Ícones do PrimeReact (substituir parcialmente lucide-react) |
| `primeflex` | ^4.x | Utilitários de layout (substituir flex/grid do Tailwind) |

### Dependências que Permanecem (independentes de UI)

| Pacote | Justificativa |
|---|---|
| `react-hook-form` + `@hookform/resolvers` + `zod` | Formulários (compatível com PrimeReact) |
| `recharts` | Gráficos (compatível, mas avaliar `@primereact/chart`) |
| `@dnd-kit/*` | Drag-and-drop no Kanban (compatível) |
| `@react-pdf/renderer` + `pdfkit` | Geração de PDF (sem alteração) |
| `react-markdown` | Renderização de markdown (sem alteração) |
| `lucide-react` | Ícones (pode coexistir com PrimeIcons) |
| `zustand` | Estado global (sem alteração) |
| `next-auth` | Autenticação (sem alteração) |
| `date-fns` | Manipulação de datas (sem alteração) |
| `axios` | HTTP client (sem alteração) |
| `tesseract.js` | OCR (sem alteração) |

---

## 2. Design System Target — Neumorphism + PrimeReact

### 2.1 Pilares do Design System

O design system atual (documentado em `docs/11-DESIGN-SYSTEM.md`) já segue uma estética **Premium Legal** com:
- Fundo `slate-50`, superfícies `white`
- Acento amber-600 para CTAs
- Tipografia serifada (Playfair Display) para títulos + sans-serif (Inter) para UI
- Bordas sutis `slate-200`, sombras de elevação `shadow-sm/md/lg`
- Foco acessível com ring amber

**A migração para Neumorphism deve preservar a identidade visual existente**, adicionando:
- Sombras internas (`box-shadow: inset`) para efeito neumórfico sutil
- Bordas mais leves ou removidas em cards e botões
- Transições suaves entre estados

### 2.2 Paleta de Cores (Design Tokens Neumorphism)

```css
:root {
  /* Fundo base — Neumorphism precisa de superfície sólida */
  --neo-bg: #f0f2f5;
  --neo-surface: #f0f2f5;
  
  /* Cores de elevação (sombras) */
  --neo-shadow-dark: #d1d5db;
  --neo-shadow-light: #ffffff;
  
  /* Paleta existente preservada */
  --color-brand-light: #f8fafc;
  --color-brand-dark: #0f172a;
  --color-brand-accent: #d97706;
  --color-brand-surface: #ffffff;
  
  /* Intensidade neumórfica */
  --neo-blur: 8px;
  --neo-distance: 4px;
  --neo-spread: 0px;
  
  /* Componentes */
  --neo-btn-shadow: 6px 6px 12px var(--neo-shadow-dark), -6px -6px 12px var(--neo-shadow-light);
  --neo-btn-shadow-inset: inset 3px 3px 6px var(--neo-shadow-dark), inset -3px -3px 6px var(--neo-shadow-light);
  --neo-card-shadow: 8px 8px 16px var(--neo-shadow-dark), -8px -8px 16px var(--neo-shadow-light);
  --neo-input-shadow: inset 2px 2px 5px var(--neo-shadow-dark), inset -2px -2px 5px var(--neo-shadow-light);
}
```

### 2.3 Componentes Neumórficos Mapeados

| Componente Atual | Componente PrimeReact | Estilo Neumorphism |
|---|---|---|
| `Button` (custom) | `Button` (PrimeReact) | Fundo neo com sombra externa, inset no hover/active |
| `Input` (custom) | `InputText` / `InputNumber` | Sombra interna (inset), borda removida |
| `Card` (custom) | `Card` (PrimeReact) | Sombra externa dupla (dark/light) |
| `Badge` (custom) | `Badge` (PrimeReact) | Sombra externa leve |
| `Modal` (custom) | `Dialog` (PrimeReact) | Backdrop blur + card neumórfico |
| `Drawer` (custom) | `Sidebar` (PrimeReact, mode=right) | Slide-in com sombra neumórfica |
| `ActionsDropdown` (custom) | `Menu` / `TieredMenu` | Sombra externa neumórfica |
| `select` nativo | `Dropdown` / `Select` (PrimeReact) | Sombra interna no campo, dropdown neumórfico |
| `table` nativa | `DataTable` (PrimeReact) | Cards neumórficos nas rows |
| `textarea` nativo | `InputTextarea` (PrimeReact) | Sombra interna (inset) |
| Loading spinners | `ProgressSpinner` (PrimeReact) | Neumórfico com anel amber |
| Paginação manual | `Paginator` (PrimeReact) | Botões neumórficos |
| Search input | `AutoComplete` (PrimeReact) | Sombra interna com ícone |
| Tab navigation | `TabView` / `TabMenu` (PrimeReact) | Abas neumórficas |
| Toast | `Toast` (PrimeReact) | Substituir `ToastContainer` custom |
| Toggle/Switch | `InputSwitch` (PrimeReact) | Neumórfico |
| Accordion | `Accordion` (PrimeReact) | Neumórfico |
| Tooltip | `Tooltip` (PrimeReact) | Neumórfico |
| Progress bar | `ProgressBar` (PrimeReact) | Sombra interna no track |
| File upload | `FileUpload` (PrimeReact) | Neumórfico com drag zone |

### 2.4 Ícones

**Estratégia:** Manter `lucide-react` para ícones específicos do domínio (INSS, CNIS, BPC) que o PrimeIcons não possui. Usar `primeicons` para ícones genéricos (setas, chevrons, check, close, etc.) conforme conveniência.

---

## 3. Fases de Migração

### FASE 0 — Setup (sem quebrar nada) ✅ CONCLUÍDA

**Objetivo:** Instalar dependências e configurar coexistência.

**Tarefas:**
- [x] Instalar `primereact` (10.9.8), `primeicons` (7.0.0), `primeflex` (4.0.0)
- [x] Importar tema base do PrimeReact (`saga-orange` — equivalente amber disponível)
- [x] Adicionar imports em `src/app/layout.tsx`:
  ```tsx
  import { PrimeReactProvider } from './PrimeReactProvider'
  import 'primereact/resources/themes/saga-orange/theme.css'
  import 'primereact/resources/primereact.min.css'
  import 'primeicons/primeicons.css'
  ```
- [x] Criar `src/app/PrimeReactProvider.tsx` — wrapper client com `ripple: true`
- [x] Criar globals neumórficos em `src/app/globals.css` (variáveis CSS + sombras)
- [x] Manter Tailwind ativo para classes residuais durante transição
- [x] **Não alterar nenhuma tela existente**

**Notas:** Build pré-existente com erro em `next.config.mjs` (`experimental.serverComponentsExternalPackages`) — não relacionado à migração PrimeReact.

**Resultado:** Componentes PrimeReact disponíveis para uso incremental alongside Tailwind.

---

### FASE 1 — Componentes Base (7 componentes)

**Objetivo:** Migrar componentes UI compartilhados. Cada migração propagará automaticamente para todas as telas que os utilizam.

| # | Componente Arquivo | Componente PrimeReact | Complexidade | Observações |
|---|---|---|---|---|
| 1.1 | `src/components/ui/Badge.tsx` | `Badge` | **BAIXA** | Mapear variantes (red/yellow/slime/blue/green/purple/slate) para cores PrimeReact customizadas |
| 1.2 | `src/components/ui/Input.tsx` | `InputText` + wrapper | **BAIXA** | Manter interface `InputProps` (label, error, hint). Wrappar PrimeReact InputText. |
| 1.3 | `src/components/ui/Button.tsx` | `Button` | **BAIXA** | Mapear variantes (primary/dark/outline/danger/ghost) para `severity`/`outlined`/`text` do PrimeReact. Manter prop `loading`. |
| 1.4 | `src/components/ui/Card.tsx` | `Card` + `CardHeader` | **BAIXA** | Mapear variant light/dark para classes neumórficas |
| 1.5 | `src/components/ui/ActionsDropdown.tsx` | `Menu` (PrimeReact) | **MÉDIA** | Reimplementar com `Menu` component, manter a API de `actions` prop |
| 1.6 | `src/components/ui/Modal.tsx` | `Dialog` | **MÉDIA** | Mapear sizes, título, backdrop. Manter API `open/onClose/title/children`. |
| 1.7 | `src/components/ui/Drawer.tsx` | `Sidebar` (mode="right") | **MÉDIA** | Mapear slide-in, backdrop blur, scroll lock. |

**Candidatos a componentes extras nesta fase:**
- `ToastContainer` → `Toast` + `confirmDialog` do PrimeReact
- `Spinner` (classe `.neo-spinner`) → `ProgressSpinner` do PrimeReact

**Resultado esperado:** Todos os ~130+ usos de componentes base propagam automaticamente para todas as 32 telas.

---

### FASE 2 — Telas de Menor Complexidade (10 telas)

**Objetivo:** Migrar telas com formulários simples ou layouts estáticos.

| # | Rota | Arquivo | Complexidade | Componentes-chave para migrar | Observações |
|---|---|---|---|---|---|
| 2.1 | `/` (redirect) | `src/app/page.tsx` | **BAIXA** | Nenhum | Apenas redirect, sem UI |
| 2.2 | `/login` | `src/app/(auth)/login/page.tsx` | **BAIXA** | `InputText`, `Button`, formulário | Google button custom, usar `Button` do PrimeReact |
| 2.3 | `/register` | `src/app/(auth)/register/page.tsx` | **BAIXA** | `InputText`, `Button`, formulário | Mesmo padrão do login |
| 2.4 | `/settings/profile` | `src/app/(dashboard)/settings/profile/page.tsx` | **BAIXA** | `Card`, `InputText`, `Button` | Formulário simples com 3 cards |
| 2.5 | `/cases/[id]/notes` | `src/app/(dashboard)/cases/[id]/notes/page.tsx` | **BAIXA** | Nenhum (redirect) | Apenas redirect para drawer |
| 2.6 | `/cases/[id]/opinions` | `src/app/(dashboard)/cases/[id]/opinions/page.tsx` | **BAIXA** | Nenhum (redirect) | Apenas redirect para drawer |
| 2.7 | `/cases/[id]/checklist` | `src/app/(dashboard)/cases/[id]/checklist/page.tsx` | **BAIXA** | Nenhum (redirect) | Apenas redirect para drawer |
| 2.8 | `/tools/social-media` | `src/app/(dashboard)/tools/social-media/page.tsx` | **BAIXA** | `InputText`, `InputTextarea`, `Button`, `Card` | Formulário + resultado com tabs de slides |
| 2.9 | `/deadlines` | `src/app/(dashboard)/deadlines/page.tsx` | **BAIXA** | `Card`, lista agrupada | Lista simples com 3 grupos (atrasados/urgentes/próximos) |
| 2.10 | `/activity` | `src/app/(dashboard)/activity/page.tsx` | **BAIXA** | `Card`, `Paginator` | Timeline simples + paginação |

**Padrões candidatos a extração:**
- Padrão de **empty state** (ícone + título + descrição + botão) — aparece em ~15 telas. Candidato a componente `EmptyState`.
- Padrão de **page header** (título + subtítulo + ações) — aparece em todas as telas. Candidato a componente `PageHeader`.
- Padrão de **loading spinner** — aparece em todas as telas. Usar `ProgressSpinner` globalmente.

---

### FASE 3 — Telas de Média Complexidade (12 telas)

**Objetivo:** Migrar telas com tabelas, filtros, modais, ou múltiplos componentes.

| # | Rota | Arquivo | Complexidade | Componentes-chave | Observações |
|---|---|---|---|---|---|
| 3.1 | `/settings/billing` | `src/app/(dashboard)/settings/billing/page.tsx` | **MÉDIA** | `Card`, `Button`, grid de planos | Cards de planos com pricing. Usar `DataTable` ou grid PrimeFlex. |
| 3.2 | `/cases/[id]` | `src/app/(dashboard)/cases/[id]/page.tsx` | **MÉDIA** | Case overview + modais | Delega para componentes `_components/`. Migrar `CaseInfoCard`, `ActivitySummary`, `StatusModal`, `EditCaseModal`. |
| 3.3 | `/cases/[id]/compare` | `src/app/(dashboard)/cases/[id]/compare/page.tsx` | **MÉDIA** | `Card`, grid de cards | Grid de cards elegível/não-elegível. Usar PrimeFlex grid. |
| 3.4 | `/clients/list/[id]` | `src/app/(dashboard)/clients/list/[id]/page.tsx` | **MÉDIA** | `Card`, `Badge`, `Button`, modais, `DataTable` implícito | Detalhe do cliente + casos + modais de criar/editar |
| 3.5 | `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | **MÉDIA** | `Card`, KPI grid | KPI cards + métricas detalhadas |
| 3.6 | `/admin/payments` | `src/app/admin/payments/page.tsx` | **MÉDIA** | `DataTable`, `Badge`, `Paginator` | Tabela com filtros e paginação. Usar `DataTable` do PrimeReact. |
| 3.7 | `/admin/users` | `src/app/admin/users/page.tsx` | **MÉDIA** | `DataTable`, `Dropdown`, `Paginator` | Tabela com busca, filtro por plano, ações inline |
| 3.8 | `/admin/metrics` | `src/app/admin/metrics/page.tsx` | **MÉDIA** | `Card`, grid de métricas | Cards de métricas em grid |
| 3.9 | `/admin/plans` | `src/app/admin/plans/page.tsx` | **MÉDIA** | `Card`, `Button`, formulários | Grid de cards editáveis com switches |
| 3.10 | `/admin/salario-minimo` | `src/app/admin/salario-minimo/page.tsx` | **MÉDIA** | `DataTable`, formulário inline | Tabela CRUD com formulário expansível |
| 3.11 | `/admin/modalidades` | `src/app/admin/modalidades/page.tsx` | **MÉDIA** | `DataTable`, formulário | Tabela CRUD com formulário expansível |
| 3.12 | `/admin/regras-aposentadoria` | `src/app/admin/regras-aposentadoria/page.tsx` | **MÉDIA** | `DataTable`, `Accordion` agrupado | Tabela agrupada por modalidade com accordion |

**Padrões candidatos a extração:**
- **CRUD Table Page** — Padrão repetido em admin (tabela + paginação + busca + filtro + formulário inline). Candidato a componente `AdminCrudPage` genérico.
- **Empty State Card** — Usado em ~8 telas. Extrair `EmptyStateCard`.

---

### FASE 4 — Telas de Alta Complexidade (10 telas)

**Objetivo:** Migrar telas com layouts complexos, drag-and-drop, abas, ou muitos sub-componentes.

| # | Rota | Arquivo | Complexidade | Componentes-chave | Observações |
|---|---|---|---|---|---|
| 4.1 | `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | **ALTA** | `TabView` implícito, gráficos, KPIs, pipeline | 5 componentes dinâmicos. Migrar `DashboardKpiGrid`, `DashboardCharts`, `DashboardPipeline`, `DashboardDeadlines`, `DashboardActivityFeed`. Recharts pode coexistir. |
| 4.2 | `/cases` | `src/app/(dashboard)/cases/page.tsx` | **ALTA** | `DataTable`, filtros avançados, paginação, modais | Tabela complexa com 8 colunas, 7 filtros, ordenação, paginação. **Candidato forte a `DataTable` do PrimeReact com colunas, filtros e paginação built-in.** |
| 4.3 | `/clients/list` | `src/app/(dashboard)/clients/list/page.tsx` | **ALTA** | `DataTable`, modais CRUD, busca | Tabela de clientes com modais de criar/editar/excluir. |
| 4.4 | `/clients/kanban` | `src/app/(dashboard)/clients/kanban/page.tsx` | **ALTA** | `@dnd-kit`, cards arrastáveis | **Manter @dnd-kit.** Migrar cards para estilo neumórfico. Kanban boards não têm equivalente direto no PrimeReact. |
| 4.5 | `/cases/[id]/cnis` | `src/app/(dashboard)/cases/[id]/cnis/page.tsx` | **ALTA** | Upload, PDF viewer, modais, edição inline | Layout 12-colunas com PDF sticky + card de status + 5 modais. **Migrar modais para `Dialog`, upload para `FileUpload` do PrimeReact.** |
| 4.6 | `/cases/[id]/bpc` | `src/app/(dashboard)/cases/[id]/bpc/page.tsx` | **ALTA** | `TabView`, formulário + IA command center | Layout 4/8 colunas com formulário + painel de abas de IA. Usar `TabView` do PrimeReact. |
| 4.7 | `/cases/[id]/calculator` | `src/app/(dashboard)/cases/[id]/calculator/page.tsx` | **ALTA** | Cards expansíveis, modais, selects | Painel com cards acordeão + modal de novo cálculo. Usar `Accordion` do PrimeReact. |
| 4.8 | `/cases/[id]/simulator` | `src/app/(dashboard)/cases/[id]/simulator/page.tsx` | **ALTA** | Cards de comparação, modais | Layout visual de antes/depois + modal com formulário. |
| 4.9 | `/cases/[id]/retroativos` | `src/app/(dashboard)/cases/[id]/retroativos/page.tsx` | **ALTA** | Cards expansíveis, tabela, modais | Cálculos expansíveis com memória de cálculo em tabela. Usar `DataTable` para parcelas. |
| 4.10 | `Case Layout` (tabs + drawers) | `src/app/(dashboard)/cases/[id]/layout.tsx` | **ALTA** | `TabMenu`, `Sidebar`, FAB | **Crítico:** Layout raiz de todos os sub-modos do caso. Migrar tabs para `TabMenu`/`TabView`, drawers para `Sidebar` do PrimeReact. |

**Padrões candidatos a extração:**
- **Modal de Novo Cálculo/Simulação/Retroativo** — Padrão repetido (formulário + validação + submit). Pode virar um `CalculationWizard` genérico.
- **Card Expansível** — Usado em calculator, simulator, retroativos. Candidato a `Accordion` genérico.

---

### FASE 5 — Limpeza Final

**Objetivo:** Remover Tailwind completamente e validar.

**Tarefas:**
- [ ] Remover `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss` do `package.json`
- [ ] Remover `tailwind.config.ts`
- [ ] Remover `prettier-plugin-tailwindcss` do `package.json`
- [ ] Limpar `src/app/globals.css`: remover `@tailwind` directives e classes utilitárias
- [ ] Substituir todas as classes residuais do Tailwind por classes PrimeFlex ou CSS custom
- [ ] Remover `clsx` e `tailwind-merge` se não houver mais uso
- [ ] Validar visualmente todas as 32 rotas
- [ ] Rodar testes E2E (`npx playwright test`) — o arquivo `tests/critical-flow.spec.ts` deve passar
- [ ] Verificar acessibilidade: contraste, foco, aria labels
- [ ] Atualizar `docs/11-DESIGN-SYSTEM.md` com novo design system neumórfico

---

## 4. Checklist por Tela

| Tela | Rota | Fase | Status | Complexidade | Observações |
|---|---|---|---|---|---|
| Root (redirect) | `/` | 2 | ✅ Concluído | BAIXA | Redirect apenas |
| Login | `/login` | 2 | ✅ Concluído | BAIXA | Formulário + Google OAuth button |
| Register | `/register` | 2 | ✅ Concluído | BAIXA | Formulário + Google OAuth button |
| Dashboard Principal | `/dashboard` | 4 | ✅ Concluído | ALTA | 5 sub-componentes dinâmicos, gráficos recharts |
| Todos os Casos | `/cases` | 4 | ✅ Concluído | ALTA | DataTable complexa com filtros e paginação |
| Detalhe do Caso | `/cases/[id]` | 3 | ✅ Concluído | MÉDIA | Overview + modais |
| Layout do Caso | `/cases/[id]` (layout) | 4 | ✅ Concluído | ALTA | Tabs + drawers + FAB. **Componente raiz crítico.** |
| Análise CNIS | `/cases/[id]/cnis` | 4 | ✅ Concluído | ALTA | Upload + PDF viewer + 5 modais |
| BPC/LOAS | `/cases/[id]/bpc` | 4 | ✅ Concluído | ALTA | TabView + formulário + IA command center |
| Cálculos | `/cases/[id]/calculator` | 4 | ✅ Concluído | ALTA | Cards expansíveis + modal de criação |
| Simulador | `/cases/[id]/simulator` | 4 | ✅ Concluído | ALTA | Layout antes/depois + modal |
| Retroativos | `/cases/[id]/retroativos` | 4 | ✅ Concluído | ALTA | Cards expansíveis + tabela de parcelas |
| Comparativo | `/cases/[id]/compare` | 3 | ✅ Concluído | MÉDIA | Grid de cards elegível/não-elegível |
| Prontuário (redirect) | `/cases/[id]/notes` | 2 | ✅ Concluído | BAIXA | Redirect para drawer |
| Pareceres (redirect) | `/cases/[id]/opinions` | 2 | ✅ Concluído | BAIXA | Redirect para drawer |
| Checklist (redirect) | `/cases/[id]/checklist` | 2 | ✅ Concluído | BAIXA | Redirect para drawer |
| Lista de Clientes | `/clients/list` | 4 | ✅ Concluído | ALTA | DataTable + modais CRUD |
| Detalhe do Cliente | `/clients/list/[id]` | 3 | ✅ Concluído | MÉDIA | Cards + modais + lista de casos |
| Kanban | `/clients/kanban` | 4 | ✅ Concluído | ALTA | Drag-and-drop com @dnd-kit (manter) |
| Perfil | `/settings/profile` | 2 | ✅ Concluído | BAIXA | Formulário simples |
| Assinatura | `/settings/billing` | 3 | ⬜ Pendente | MÉDIA | Cards de pricing |
| Carrossel Instagram | `/tools/social-media` | 2 | ✅ Concluído | BAIXA | Formulário + resultado |
| Atividade | `/activity` | 2 | ✅ Concluído | BAIXA | Timeline + paginação |
| Prazos | `/deadlines` | 2 | ✅ Concluído | BAIXA | Lista agrupada |
| Admin Dashboard | `/admin/dashboard` | 3 | ✅ Concluído | MÉDIA | KPI cards + métricas |
| Admin Usuários | `/admin/users` | 3 | ✅ Concluído | MÉDIA | DataTable + ações inline |
| Admin Pagamentos | `/admin/payments` | 3 | ✅ Concluído | MÉDIA | DataTable + filtros |
| Admin Métricas | `/admin/metrics` | 3 | ✅ Concluído | MÉDIA | Cards de métricas |
| Admin Planos | `/admin/plans` | 3 | ✅ Concluído | MÉDIA | Cards editáveis |
| Admin Salário Mínimo | `/admin/salario-minimo` | 3 | ✅ Concluído | MÉDIA | Tabela CRUD |
| Admin Modalidades | `/admin/modalidades` | 3 | ✅ Concluído | MÉDIA | Tabela CRUD |
| Admin Regras | `/admin/regras-aposentadoria` | 3 | ✅ Concluído | MÉDIA | Tabela agrupada |

### Componentes Compartilhados

| Componente | Fase | Status | Complexidade | Observações |
|---|---|---|---|---|
| `Button` | 1 | ✅ Concluído | BAIXA | 5 variantes → neo-btn neumorphism |
| `Input` | 1 | ✅ Concluído | BAIXA | Wrapper com label/error → PrimeReact InputText |
| `Card` / `CardHeader` | 1 | ✅ Concluído | BAIXA | 2 variantes → PrimeReact Card + neumorphism |
| `Badge` | 1 | ✅ Concluído | BAIXA | 7 variantes → PrimeReact Badge |
| `Modal` | 1 | ✅ Concluído | MÉDIA | 3 sizes → PrimeReact Dialog |
| `Drawer` | 1 | ✅ Concluído | MÉDIA | Slide-in → PrimeReact Sidebar |
| `ActionsDropdown` | 1 | ✅ Concluído | MÉDIA | → PrimeReact Menu |
| `Header` | 2+ | ✅ Concluído | MÉDIA | Search + notifications + user menu |
| `Sidebar` | 2+ | ✅ Concluído | MÉDIA | Nav items + UsageBar + logout |
| `ToastContainer` | 1 | ✅ Concluído | BAIXA | → PrimeReact Toast |
| `UpgradeModal` | 2+ | ✅ Concluído | BAIXA | → PrimeReact Dialog |
| `ErrorBoundary` | Manter | ⬜ Pendente | — | Não é componente UI, manter |
| `ClientSwitcher` | 2+ | ✅ Concluído | BAIXA | Toggle list/kanban |
| `UsageBar` | 2+ | ✅ Concluído | BAIXA | → PrimeReact ProgressBar |
| `CnisInfoCard` | 3 | ✅ Concluído | BAIXA | Info card simples |

### Sub-componentes de Domínio (migrar junto com a tela pai)

| Componente | Fase | Status | Complexidade |
|---|---|---|---|
| `DashboardKpiGrid` | 4 | ✅ Concluído | MÉDIA |
| `DashboardCharts` | 4 | ✅ Concluído | MÉDIA (recharts coexiste) |
| `DashboardPipeline` | 4 | ✅ Concluído | MÉDIA |
| `DashboardDeadlines` | 4 | ✅ Concluído | BAIXA |
| `DashboardActivityFeed` | 4 | ✅ Concluído | BAIXA |
| `BpcForm` | 4 | ✅ Concluído | MÉDIA |
| `BpcFormSection` | 4 | ✅ Concluído | BAIXA |
| `BpcResult` | 4 | ✅ Concluído | MÉDIA |
| `BpcLaudoModal` | 4 | ✅ Concluído | BAIXA |
| `BpcSocialInterview` | 4 | ✅ Concluído | ALTA |
| `CaseOpinionsDrawer` | 4 | ✅ Concluído | MÉDIA |
| `CaseNotesDrawer` | 4 | ✅ Concluído | MÉDIA |
| `CaseBpcDrawer` | 4 | ✅ Concluído | MÉDIA |
| `CaseChecklistDrawer` | 4 | ✅ Concluído | MÉDIA |
| `CaseFloatingActions` | 4 | ✅ Concluído | MÉDIA |
| `ClientFloatingActions` | 3 | ✅ Concluído | MÉDIA |
| `CaseInfoCard` | 3 | ✅ Concluído | BAIXA |
| `ActivitySummary` | 3 | ✅ Concluído | BAIXA |
| `StatusModal` | 3 | ✅ Concluído | BAIXA |
| `EditCaseModal` | 3 | ✅ Concluído | MÉDIA |
| `CaseOverviewSkeleton` | 3 | ✅ Concluído | BAIXA |
| `CnisHeader` | 4 | ✅ Concluído | MÉDIA |
| `CnisBanners` | 4 | ✅ Concluído | BAIXA |
| `CnisUploadOverlay` | 4 | ✅ Concluído | BAIXA |
| `CnisUploadDropzone` | 4 | ✅ Concluído | MÉDIA |
| `CnisStatusCard` | 4 | ✅ Concluído | ALTA |
| `CnisExtractedData` | 4 | ✅ Concluído | MÉDIA |
| `PeriodItem` | 4 | ✅ Concluído | BAIXA |
| `DeleteModal` | 4 | ✅ Concluído | BAIXA |
| `SaveConfirmModal` | 4 | ✅ Concluído | BAIXA |
| `ReprocessModal` | 4 | ✅ Concluído | BAIXA |
| `EditPeriodModal` | 4 | ✅ Concluído | MÉDIA |
| `EditSalariesModal` | 4 | ✅ Concluído | MÉDIA |

---

## 5. Riscos e Decisões em Aberto

### 🔴 Riscos Críticos

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| 1 | **Recharts pode conflitar** com temas PrimeReact | Baixo | Recharts usa SVG inline, não depende de classes CSS. Coexiste tranquila. |
| 2 | **@dnd-kit no Kanban** não tem equivalente PrimeReact | Médio | Manter @dnd-kit. Migrar apenas o visual dos cards para neumórfico. |
| 3 | **PDF components** (`@react-pdf/renderer`) usam JSX próprio, não Tailwind | Baixo | Não afeta migração — PDFs são gerados separadamente do DOM. |
| 4 | **react-markdown** em `BpcResult` usa classes Tailwind (prose) | Médio | Substituir por estilos PrimeFlex ou CSS custom para markdown rendering. |
| 5 | **Hooks customizados** que referenciam classes Tailwind diretamente | Médio | Revisar todos os hooks: `useUrgentDeadlines`, `useCaseOverview`, `useCnis*`. Não devem ter dependência de classes CSS. |

### 🟡 Decisões Pendentes

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | **Manter lucide-react ou migrar tudo para PrimeIcons?** | A) Manter lucide + PrimeIcons; B) Tudo PrimeIcons | **A) Manter lucide.** PrimeIcons não tem ícones de domínio (INSS, CNIS, BPC). Coexistência é segura. |
| 2 | **Tema neumórfico custom ou usar tema saga-amber como base?** | A) Custom neumórfico; B) saga-amber + overrides | **A) Custom.** Criar tema `neo-amber` com sombras neumórficas. saga-amber tem visual flat que conflita. |
| 3 | **DataTable do PrimeReact para tabelas ou manter HTML tables?** | A) DataTable; B) Manter `<table>` + PrimeFlex | **A) DataTable.** Oferece sorting, filtering, pagination, selection nativos — reduz código em ~40% nas telas de tabela. |
| 4 | **PrimeFlex 100% ou CSS custom para neumorphism?** | A) PrimeFlex; B) CSS custom | **B) CSS custom.** Neumorphism requer sombras específicas que PrimeFlex não fornece. Usar PrimeFlex apenas para grid/flex. |
| 5 | **Migrar admin junto ou separado?** | A) Junto com dashboard; B) Depois | **A) Junto.** Admin usa os mesmos componentes base. Migrar em paralelo economiza retrabalho. |
| 6 | **react-hook-form + PrimeReact InputText** | Manter react-hook-form (recomendado) | Primitivas do react-hook-form (`register`) funcionam com InputText via `forwardRef`. |
| 7 | **Toast custom vs PrimeReact Toast** | A) PrimeReact Toast; B) Manter custom | **A) PrimeReact Toast.** Funcionalidade equivalente com API mais rica (life, sticky, position). |

### 🟢 Padrões Identificados para Extração

| Padrão | Ocorrências | Componente Candidato |
|---|---|---|
| **Empty State** (ícone + título + descrição + botão) | ~15 telas | `EmptyState` |
| **Page Header** (título + subtítulo + botões de ação) | ~20 telas | `PageHeader` |
| **Loading Spinner** centralizado | ~25 telas | `ProgressSpinner` (PrimeReact) |
| **CRUD Table** (tabela + busca + filtro + paginação + modal) | 6 telas admin | `AdminCrudPage` genérico |
| **Modal de Criação** (formulário + validação + submit) | ~10 modais | Usar `Dialog` + padrão consistente |
| **Card KPI** (ícone + valor + label) | 3 telas (dashboard, admin) | `KpiCard` |
| **Tab de IA** (gerar → resultado → copiar/regenerar) | 5 tabs BPC | `AiAnalysisTab` |

### 📋 Pré-requisitos antes de iniciar

- [ ] Definir se o tema neumórfico será light-only ou terá dark mode
- [ ] Decidir sobre o tema PrimeReact (custom neo-amber vs saga-amber + overrides)
- [ ] Criar protótipo visual do neumorphism em 1-2 telas para validação antes de migrar tudo
- [ ] Garantir que os testes E2E (`tests/critical-flow.spec.ts`) passam antes de iniciar
- [ ] Branch dedicada para a migração (`feat/primereact-migration`)

---

## 6. Estimativa de Esforço

| Fase | Telas | Componentes | Esforço Estimado |
|---|---|---|---|
| FASE 0 — Setup | — | — | 0.5 dia |
| FASE 1 — Componentes base | — | 7 | 2-3 dias |
| FASE 2 — Telas BAIXA | 10 | 3 | 2-3 dias |
| FASE 3 — Telas MÉDIA | 12 | 5 | 4-5 dias |
| FASE 4 — Telas ALTA | 10 | 25+ | 7-10 dias |
| FASE 5 — Limpeza | 32 | — | 2-3 dias |
| **Total** | **32** | **~40** | **18-25 dias** |

> **Nota:** Os números acima são estimativas para um desenvolvedor sênior focado. O maior ganho de velocidade virá da FASE 1, pois os 7 componentes base são usados em todas as telas — migrar apenas eles já atualiza visualmente todo o app.

---

## 7. Referências

- [PrimeReact Documentation](https://primereact.org/)
- [PrimeFlex Utilities](https://primeflex.org/)
- [PrimeIcons](https://primeicons.com/)
- [PrimeReact Themes](https://primereact.org/theming/)
- [Design System atual](./11-DESIGN-SYSTEM.md)
- [Neumorphism CSS Generator](https://neumorphism.io/)
