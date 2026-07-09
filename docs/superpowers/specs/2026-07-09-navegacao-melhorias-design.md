# Navegação — Melhorias Mobile + Desktop + Busca Global

> **Objetivo:** Refatorar a navegação do Previando para mobile (BottomNav + sidebar), desktop (sidebar com avatar/modo ícones), busca global (Cmd+K), e unificação Calendário/Prazos.

**Arquitetura:** Componentes React client-side com Zustand para estado global. Busca combina cache local (clientes/casos) + API remota. Sidebar e BottomNav compartilham a mesma store de estado.

**Tech Stack:** Next.js 14 App Router, Zustand, lucide-react, Tailwind CSS

---

## 1. Mobile — BottomNav + Sidebar

### BottomNav redesign

5 itens fixos, todos com badges inteligentes:

| Ícone | Label | Badge | Rota |
|-------|-------|-------|------|
| LayoutDashboard | Dashboard | — | `/dashboard` |
| Users | Clientes | total ativos | `/clients/list` |
| FolderOpen | Casos | pendentes | `/cases` |
| CalendarDays | Agenda | prazos urgentes | `/calendar` |
| Search | Buscar | — | abre modal de busca |

- Badge de prazos urgentes usa `useUrgentDeadlines` hook (já existente)
- Badge de clientes ativos via `useClientCount` (novo hook simples, fetch `/clients/count`)
- Badge de casos pendentes via `usePendingCasesCount` (novo hook simples)
- O quinto item "Buscar" abre o `GlobalSearch` modal (seção 3)

### Sidebar overlay

- Remover o item "Mais" do BottomNav (substituído pelo Search)
- Sidebar continua acessível pelo hamburger no Header (já implementado)
- Fechar sidebar ao navegar (já implementado)

### Ação rápida (long-press no Search)

- `onContextMenu` ou `onPointerDown` com delay no botão Search mostra:

```tsx
<QuickActionSheet
  actions={[
    { label: 'Novo Cliente', icon: UserPlus, href: '/clients/new' },
    { label: 'Novo Caso', icon: FolderPlus, href: '/cases/new' },
    { label: 'Importar CNIS', icon: Upload, href: '/tools/cnis' },
  ]}
/>
```

### Arquivos

- Modify: `src/components/ui/MobileBottomNav.tsx` — adicionar 5º item, badges
- Create: `src/components/ui/QuickActionSheet.tsx` — bottom sheet de ações rápidas
- Create: `src/hooks/useClientCount.ts` — fetch contagem clientes ativos
- Create: `src/hooks/usePendingCasesCount.ts` — fetch contagem casos pendentes

---

## 2. Sidebar Desktop — Refinamentos

### Avatar + Informações do Usuário no topo

Adicionar no topo da sidebar (antes do logo):

```tsx
<div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-serif font-bold text-amber-700">
    {initials}
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-sans text-sm font-bold text-slate-900 truncate">{user.name}</p>
    <p className="font-sans text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{user.plan}</p>
  </div>
</div>
```

- Usar dados da sessão (`useSession()` do NextAuth, já disponível)

### Modo colapsado (64px)

Quando `!isDesktopOpen`, a sidebar hoje fica com `lg:w-0 lg:border-none` — some tudo.

Mudar para `lg:w-16` com apenas ícones + tooltips:

- Cada item de navegação mostra apenas o ícone
- `title` ou tooltip com o nome do item
- Badges (prazos) ficam visíveis
- Avatar vira miniatura (`w-8 h-8`)
- Ao fazer hover, tooltip aparece (usando componente `Tooltip` já existente em `src/components/ui/Tooltip.tsx`)

### Seção "Recentes"

Últimos 3-5 itens acessados via `localStorage`:

```tsx
interface RecentItem {
  type: 'client' | 'case'
  id: string
  label: string
  href: string
  visitedAt: string
}
```

- Store: `useRecentStore` (Zustand com persistência localStorage)
- Máximo 5 itens, ordenados por `visitedAt` descendente
- Ao visitar um cliente ou caso, adicionar aos recentes
- Exibir na sidebar abaixo do avatar

### Atalhos de teclado visíveis

Adicionar atalhos ao lado dos itens mais usados:

| Item | Atalho |
|------|--------|
| Dashboard | `⌘1` |
| Clientes | `⌘2` |
| Casos | `⌘3` |
| Agenda | `⌘4` |
| Busca | `⌘K` |

- Renderizar como `<kbd>` tag estilizada à direita do label
- Visível apenas na sidebar expandida
- Integrar com hook `useKeyboardShortcuts` já existente

### Arquivos

- Modify: `src/components/Sidebar.tsx` — avatar, modo ícones, shortcuts, recentes
- Create: `src/store/recent-store.ts` — Zustand store com persistência localStorage
- Modify: `src/hooks/useKeyboardShortcuts.ts` — adicionar shortcuts ⌘1-4

---

## 3. Busca Global (Cmd+K)

### Modal tipo Command Palette

```tsx
<GlobalSearch
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(result) => router.push(result.href)}
/>
```

### Funcionalidades

| Feature | Implementação |
|---------|---------------|
| Atalho ⌘K / Ctrl+K | Hook `useKeyboardShortcuts` (existente) |
| Atalho `/` | Capturar tecla em qualquer input |
| Input com debounce 300ms | `useState` + `setTimeout` |
| Navegação setas | `useState<number>` para índice ativo |
| Fechar com Escape | `onKeyDown` no overlay |
| Categorias visuais | Clientes, Casos, Páginas, Ações |
| Cache local | Clientes/casos armazenados em `useRef` |

### Fontes de dados

1. **Local (instantâneo):** clientes e casos já carregados no cache da app (Zustand stores)
2. **Remoto (fallback):** `GET /search?q=termo` (nova API route)
3. **Ações rápidas:** lista estática de comandos disponíveis

### Design do modal

```tsx
<div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
  <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
    {/* Input */}
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
      <Search className="w-5 h-5 text-slate-400" />
      <input
        autoFocus
        value={query}
        onChange={handleQuery}
        placeholder="Buscar clientes, casos, páginas..."
        className="flex-1 text-base font-sans bg-transparent outline-none placeholder:text-slate-400"
      />
      <kbd className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded">ESC</kbd>
    </div>

    {/* Results */}
    <div className="max-h-[60dvh] overflow-y-auto p-2 space-y-2">
      {/* Categorias com resultados */}
    </div>

    {/* Footer */}
    <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
      <span className="text-[10px] text-slate-400">↑↓ Navegar</span>
      <span className="text-[10px] text-slate-400">↵ Abrir</span>
      <span className="text-[10px] text-slate-400">⌘K Fechar</span>
    </div>
  </div>
</div>
```

### API Route

- `src/app/api/search/route.ts` — busca textual em clientes e casos do usuário autenticado
- Usa Prisma com `contains` case-insensitive nos campos `name` e `cpf` (clientes) e `benefitType` (casos)
- Rate-limited (já existe middleware)

### Arquivos

- Create: `src/components/search/GlobalSearch.tsx` — modal de busca
- Create: `src/components/search/SearchResultItem.tsx` — item de resultado
- Create: `src/app/api/search/route.ts` — API de busca
- Create: `src/store/search-store.ts` — Zustand store (open/close/history)
- Modify: `src/components/ui/MobileBottomNav.tsx` — abrir busca no 5º item
- Modify: `src/components/Header.tsx` — adicionar botão de busca

---

## 4. Unificar Calendário + Prazos

### Abordagem: Calendário como hub

- `/calendar` ganha toggle de visão: `[ Mês | Agenda | Prazos ]`
- `/deadlines` vira redirect 301 para `/calendar?view=deadlines`
- Sidebar: remover item "Prazos", badge de urgentes vai pro "Agenda"

### View "Prazos" em `/calendar`

- Filtro automático: `activeFilters = new Set(['deadline', 'prescription'])`
- Cards expandidos com info de cliente, data, status
- Ordenação por data crescente
- Botão "Marcar como concluído"

### Badge na sidebar

- Em vez de `urgentDeadlines` badge no item "Prazos", mostrar no item "Agenda"
- Reaproveitar `useUrgentDeadlines` hook

### Arquivos

- Modify: `src/app/(dashboard)/calendar/page.tsx` — adicionar view "Prazos"
- Modify: `src/components/Sidebar.tsx` — badge no item Agenda, remover Prazos
- Modify: `src/components/ui/MobileBottomNav.tsx` — badge de urgentes no Agenda
- Create: `src/app/(dashboard)/deadlines/not-found.tsx` — ou redirect no layout

---

## 5. Considerações Técnicas

### Performance
- BottomNav badges com hooks de polling a cada 60s (ou usar dados já carregados)
- GlobalSearch com virtualização se >50 resultados
- Sidebar modo Ícones sem re-renderização desnecessária (já usa `memo`)

### Acessibilidade
- BottomNav: `role="navigation"`, `aria-current="page"`
- GlobalSearch: `role="dialog"`, `aria-modal="true"`, focus trap
- Sidebar tooltips: `aria-label` nos ícones
- Atalhos de teclado: documentados no `ShortcutsModal` (já existe)

### Mobile
- BottomNav com `pb-[env(safe-area-inset-bottom)]` (já implementado)
- Touch targets >= 44px (todos os itens do BottomNav já têm)
- QuickActionSheet com `useBodyScrollLock` + `useFocusTrap` (já existem)

### Estados
- Loading: skeleton no avatar/sidebar enquanto sessão carrega
- Empty: GlobalSearch mostra "Nenhum resultado" com EmptyState
- Error: GlobalSearch silencia erro, mantém cache anterior

---

## 6. Arquivos — Resumo

| Ação | Arquivo |
|------|---------|
| MODIFY | `src/components/ui/MobileBottomNav.tsx` |
| CREATE | `src/components/ui/QuickActionSheet.tsx` |
| CREATE | `src/hooks/useClientCount.ts` |
| CREATE | `src/hooks/usePendingCasesCount.ts` |
| MODIFY | `src/components/Sidebar.tsx` |
| CREATE | `src/store/recent-store.ts` |
| MODIFY | `src/hooks/useKeyboardShortcuts.ts` |
| CREATE | `src/components/search/GlobalSearch.tsx` |
| CREATE | `src/components/search/SearchResultItem.tsx` |
| CREATE | `src/app/api/search/route.ts` |
| CREATE | `src/store/search-store.ts` |
| MODIFY | `src/components/Header.tsx` |
| MODIFY | `src/app/(dashboard)/calendar/page.tsx` |
| MODIFY | `src/components/ui/MobileBottomNav.tsx` (atualizar badge) |
| CREATE | `src/app/(dashboard)/deadlines/redirect.ts` (ou similar) |
