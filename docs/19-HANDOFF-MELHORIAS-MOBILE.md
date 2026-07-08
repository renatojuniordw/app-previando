# 19 — Handoff: Melhorias Mobile (UI/UX/Usabilidade)

> Gerado em 08/07/2026 — para continuidade em sessão futura.
> Base: `docs/18-PLANO-MELHORIAS-MOBILE.md`

---

## 🎯 O que foi implementado

### Fase 1 — Correções críticas (telas cortadas) ✅

| Item | O quê | Arquivos |
|------|-------|----------|
| **1.1 dvh** | `h-screen`/`100vh` → `dvh` em todos os layouts e páginas | `layout.tsx`, `Sidebar.tsx`, `admin/layout.tsx`, `dashboard/page.tsx`, `reports/page.tsx`, `calendar/page.tsx`, `kanban/page.tsx`, `cnis/page.tsx`, `loading.tsx` |
| **1.2 Modal** | Scroll interno, `max-h-[85dvh]`, `useBodyScrollLock`, bottom-sheet mobile, close `min-w-[44px]` | `Modal.tsx` |
| **1.3 Admin mobile** | Sidebar responsiva com overlay + hamburger + store própria | `AdminLayoutClient.tsx` (novo), `admin-sidebar.ts` (novo), `admin/layout.tsx` |
| **1.4 Safe areas** | `env(safe-area-inset-*)` no body, `viewportFit: cover`, `-webkit-tap-highlight-color` | `globals.css`, `layout.tsx` |

### Fase 2 — Usabilidade ✅

| Item | O quê | Arquivos |
|------|-------|----------|
| **2.1 Inputs 16px** | `.neo-input` com `text-base sm:text-sm`; Header search idem | `globals.css`, `Header.tsx` |
| **2.2 Touch targets** | Button com `min-h-[44px]` mobile, `touch-action: manipulation` global | `Button.tsx`, `globals.css` |
| **2.3 Teclados** | `inputMode`, `autoComplete` no AddressFields | `AddressFields.tsx` |
| **2.4 Grids forms** | Grids revisados (pares curtos mantidos, demais responsivos) | Diversos |

### Fase 3 — Dual-view (cards no mobile) ✅

| Item | O quê | Arquivos |
|------|-------|----------|
| **MobileCardList** | Componente genério reutilizável com suporte a `href` (Link) e `onClick` | `components/ui/MobileCardList.tsx` (novo) |
| **Clientes** | Tabela `hidden md:table` + cards `md:hidden` | `clients/list/page.tsx` |
| **Casos** | Mesmo padrão | `cases/page.tsx` |
| **Honorários** | Mesmo padrão + KPIs em `grid-cols-2` no mobile | `honorarios/page.tsx` |

### Fase 4 — Telas específicas ✅

| Item | O quê | Arquivos |
|------|-------|----------|
| **4.1 Calendário** | Agenda view como padrão mobile, toggle Mês/Lista, grade compacta `min-h-[52px]`, bottom-sheet ao tocar dia, chips de filtro roláveis | `calendar/page.tsx` |
| **4.2 Kanban** | `snap-x snap-mandatory`, chips de navegação com IntersectionObserver, mover por menu (dropdown), long-press para drag (`delay: 250`), empty state por dispositivo | `kanban/page.tsx` |
| **4.3 Header** | Busca overlay fullscreen no mobile, nome/cargo `hidden sm:flex`, `Notification.requestPermission()` removido do mount | `Header.tsx` |
| **4.4 Case detail** | Breadcrumb "Voltar" no mobile, header compacto (`py-3 md:py-4`), px responsivo | `CaseLayoutClient.tsx` |
| **4.5 Paddings** | Padronizados para `p-4 sm:p-6 lg:p-8` | Diversos |
| **4.6 Tipografia** | `.text-micro` utility, contrastes revisados | `globals.css` |

### Fase 5 — Polimento ✅

| Item | O quê | Arquivos |
|------|-------|----------|
| **5.1 Bottom nav** | `MobileBottomNav` com 5 tabs (Dashboard, Clientes, Casos, Calendário, Mais), safe-area, badge de urgência | `MobileBottomNav.tsx` (novo), `layout.tsx` |
| **5.2 Active states** | `.touch-active:active`, `active:bg-slate-50` em cards e botões | `globals.css` |

### Anexo A — Correções específicas ✅

| Item | O quê |
|------|-------|
| **A.1 Menu caso** | `useBodyScrollLock`, `useFocusTrap`, `85dvh`, `overscroll-contain`, safe-area, grabber, grid 2 colunas |
| **A.2 FAB** | `pointer-events-none` no container + `pointer-events-auto` nos filhos + `invisible` quando fechado |
| **A.3 CNIS** | Breadcrumb "Voltar" no mobile, toolbar com ⋮ dropdown (só +Adicionar visível), salários limitados a 6 + "Ver todas" |
| **A.4 KPIs** | Layout horizontal compacto no mobile (ícone menor, `flex`) |
| **A.5 ActivitySummary** | `grid-cols-3` sempre, cards verticais compactos |
| **A.8 Activity feed** | Tabela convertida para timeline vertical com grouping por dia, timestamps relativos, "Carregar mais" |
| **A.9 Dicionário CNIS** | Accordion recolhido por padrão, sticky search + chips, legendas de tipo no topo, agrupado por grupo |

### Sugestões adicionais implementadas ✅

| Item | O quê |
|------|-------|
| **FilterSheet** | Componente reutilizável de filtros em bottom-sheet (select/text/number/date/chips). Aplicado em Casos |
| **BottomSheet** | Componente genérico extraído do CaseLayoutClient, com `useBodyScrollLock` + `useFocusTrap` + grabber |
| **Charts skeleton** | `grid-cols-2 sm:grid-cols-4` no loading state do KPI grid |
| **Checklist mobile** | Adicionado ao `docs/11-DESIGN-SYSTEM.md` |

---

## 🏗 Arquitetura de componentes criados

### `components/ui/MobileCardList.tsx`
```
Props: { cards: MobileCard[], className? }
MobileCard: { id, primary, secondary?, fields[], badge?, href?, onClick?, actions? }
```
- Renderiza cards quando `href` (usa `<Link>`) ou `onClick` (usa `<div>` com role button)
- Escondido em `md:` (convive com tabela desktop)

### `components/ui/MobileBottomNav.tsx`
```
5 tabs: Dashboard, Clientes, Casos, Calendário, Mais
- "Mais" abre sidebar via useSidebarStore.open()
- Badge de prazos urgentes no Calendário
- safe-area: pb-[env(safe-area-inset-bottom)]
- lg:hidden
```

### `components/ui/BottomSheet.tsx`
```
Props: { open, onClose, children, title?, className? }
- useBodyScrollLock + useFocusTrap
- max-h-[85dvh] overflow-y-auto overscroll-contain
- Grabber + close button 44px
- z-[60]
```

### `components/ui/FilterSheet.tsx`
```
Props: { open, onClose, filters[], activeCount, onClear, onApply, title? }
FilterOption: { type: 'select'|'text'|'number'|'date'|'chips', id, label, options?, value, onChange, placeholder? }
- Bottom-sheet mobile, modal desktop
- z-[60]
```

---

## 🧩 Convenção de z-index

| Componente | Classe | Valor |
|------------|--------|-------|
| Bottom nav | `z-50` | 50 |
| Sidebar overlay | `z-30` | 30 |
| Sidebar | `z-40` | 40 |
| Modais/Drawers/BottomSheets/FilterSheet | `z-[60]` | 60 |
| FABs (CaseFloatingActions, ClientFloatingActions) | `z-[60]` | 60 |
| Toast | `z-[70]` (confirmar) | 70 |

**Regra:** todo modal/overlay que compete com a bottom nav deve usar `z-[60]` (valor arbitrário do Tailwind, já que `z-60` não existe na escala padrão).

---

## 🐛 Correções de bugs aplicadas

### 1. Z-index inválido `z-60`
**Problema:** `z-60` não existe no Tailwind (escala vai até `z-50`). Não gerava CSS.
**Correção:** Substituído por `z-[60]` (sintaxe de valor arbitrário) em todos os FABs e modais.

### 2. FAB sobrepondo bottom nav
**Problema:** FAB com `bottom-6` ficava atrás ou sobrepunha a bottom nav.
**Correção:** 
- FABs: `bottom-[5rem] right-4 sm:right-6 lg:bottom-6` (sobe 80px no mobile)
- Tamanho reduzido: `w-14 h-14` → `w-11 h-11` (56px → 44px)
- Sub-botões: `w-12 h-12` → `w-10 h-10`, ícones `w-5` → `w-4`

### 3. MobileCardList sem navegação
**Problema:** `href` era ignorado — não navegava.
**Correção:** Quando `href` existe, renderiza `<Link href={href}>` em volta do card inteiro.

### 4. Hamburger duplicado no mobile
**Problema:** Hamburger no header + "Mais" no bottom nav faziam mesma coisa.
**Correção:** Hamburger `hidden lg:flex` (só visível no desktop).

### 5. Modais com z-index igual ao da bottom nav
**Problema:** Modal/BottomSheet/FilterSheet/Drawer/ConfirmDialog com `z-50` (mesmo da nav). Desempate por ordem DOM fazia nav vencer.
**Correção:** Todos os overlays modais → `z-[60]`.

---

## 📋 Pendências / Sugestões não implementadas

### Prioridade média
- [ ] **Gerar PNG icons** para PWA (192x192, 512x512, apple-touch-icons). Hoje só SVG. Criar script ou task de design.
- [ ] **Gráficos do dashboard** — revisar `DashboardCharts.tsx` para mobile: ticks abreviados (`jan`/`fev`), tooltips por toque, menos gridlines.

### Prioridade baixa
- [ ] **Virtualização na activity** — se o usuário tem anos de auditoria, a timeline pode renderizar centenas de itens. Usar `react-virtual` ou janela de ~50 itens.
- [ ] **AdminTable** — aplicar `MobileCardList` nas tabelas admin (regras de aposentadoria, etc.) se houver uso mobile significativo.

---

## 🔍 Padrões de código estabelecidos

### Mobile-first condicional
```tsx
// Tabela + cards convivem
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>
<MobileCardList cards={...} />
```

### Bottom-sheet pattern
```tsx
<BottomSheet open={open} onClose={handleClose} title="Título">
  {children}
</BottomSheet>
```

### Filter bottom-sheet
```tsx
<button onClick={() => setShowFilters(true)}>
  Filtros {activeCount > 0 && <Badge>{activeCount}</Badge>}
</button>
<FilterSheet
  open={showFilters}
  onClose={() => setShowFilters(false)}
  filters={filterConfig}
  activeCount={activeCount}
  onClear={clearFilters}
  onApply={() => setShowFilters(false)}
/>
```

### Z-index hierarchy
```tsx
// Overlays modais sempre acima da bottom nav
className="fixed inset-0 z-[60] ..."

// Bottom nav fixa
className="fixed bottom-0 z-50 ..."

// FABs sobem no mobile
className="fixed bottom-[5rem] right-4 z-[60] lg:bottom-6 ..."
```
