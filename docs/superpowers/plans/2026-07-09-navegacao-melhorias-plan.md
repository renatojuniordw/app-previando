# Navegação — Melhorias Mobile + Desktop + Busca Global

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a navegação do Previando — mobile (BottomNav + ações rápidas), desktop (sidebar com avatar/modo ícones/atalhos), busca global (Cmd+K), e unificação Calendário/Prazos.

**Architecture:** 4 subsystems independentes que compartilham Zustand stores e hooks. Podem ser implementados em paralelo. Cada task produz mudanças testáveis independentemente.

**Tech Stack:** Next.js 14 App Router, React 18, Zustand 5, lucide-react, Tailwind CSS 3.4

## Global Constraints

- DRY First + SOLID — buscar código existente antes de criar
- Português-first — labels em português, lowercase headings
- Touch targets >= 44px no mobile
- Safe-area insets no BottomNav (já implementado)
- Usar hooks compartilhados existentes: `useApi`, `useBodyScrollLock`, `useFocusTrap`, `useKeyboardShortcuts`
- Componentes em `src/components/`, hooks em `src/hooks/`, stores em `src/store/`

---

### Task 1: MobileBottomNav — badges + 5º item Search

**Files:**
- Modify: `src/components/ui/MobileBottomNav.tsx`

**Interfaces:**
- Consumes: `useUrgentDeadlines` (existente), `useClientCount` (Task 1b), `usePendingCasesCount` (Task 1c)
- Produces: BottomNav com 5 itens + badges + trigger p/ GlobalSearch

- [ ] **Step 1: Add new hooks**

Create `src/hooks/useClientCount.ts`:
```tsx
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useClientCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    api.get('/clients/count').then(r => setCount(r.data.total)).catch(() => {})
  }, [])
  return count
}
```

Create `src/hooks/usePendingCasesCount.ts`:
```tsx
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function usePendingCasesCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    api.get('/cases/count?status=PENDING').then(r => setCount(r.data.total)).catch(() => {})
  }, [])
  return count
}
```

Wait — we don't know if these API routes exist. Let me check if there are alternative endpoints. Actually, looking at the existing code, `useUrgentDeadlines` already fetches from some endpoint. Let me check the pattern.

Actually, for simplicity and avoiding new API routes, we can compute these from existing data. Let me just use the clients list and cases list endpoints. Or better yet, let me create generic count hooks that the agents can implement.

Actually, let me simplify this. Instead of creating new API routes, the hooks should just use existing data. Let me restructure.

- [ ] **Step 1: Read existing files**

Read `src/hooks/useUrgentDeadlines.ts` to understand the pattern.
Read `src/components/ui/MobileBottomNav.tsx` for current implementation.

- [ ] **Step 2: Modify MobileBottomNav.tsx**

Replace the NAV_ITEMS and add search store trigger:

```tsx
import { useSearchStore } from '@/store/search-store'
import { useClientCount } from '@/hooks/useClientCount'
import { usePendingCasesCount } from '@/hooks/usePendingCasesCount'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients/list', label: 'Clientes', icon: Users, badge: 'clients' as const },
  { href: '/cases', label: 'Casos', icon: FolderOpen, badge: 'cases' as const },
  { href: '/calendar', label: 'Agenda', icon: CalendarDays, badge: 'deadlines' as const },
  // 5th item is "Search" — handled separately
]
```

Replace the last `<li>` (MoreHorizontal button) with a search trigger:
```tsx
<li className="flex-1">
  <button
    type="button"
    onClick={() => useSearchStore.getState().open()}
    aria-label="Buscar"
    className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-inset"
  >
    <Search className="h-5 w-5" aria-hidden="true" />
    <span>Buscar</span>
  </button>
</li>
```

Add badge logic inside the map:
```tsx
{item.badge === 'clients' && clientCount > 0 && (
  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold leading-none text-white">
    {clientCount > 9 ? '9+' : clientCount}
  </span>
)}
{item.badge === 'cases' && pendingCount > 0 && (
  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold leading-none text-white">
    {pendingCount > 9 ? '9+' : pendingCount}
  </span>
)}
```

Add imports: `Search` from lucide-react, `useSearchStore` from store.

- [ ] **Step 3: Create client count hook**

Create `src/hooks/useClientCount.ts`:
```tsx
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useClientCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    api.get('/clients?limit=1').then(r => setCount(r.data.total ?? 0)).catch(() => {})
  }, [])
  return count
}
```

- [ ] **Step 4: Create pending cases count hook**

Create `src/hooks/usePendingCasesCount.ts`:
```tsx
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function usePendingCasesCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    api.get('/cases?limit=1').then(r => setCount(r.data.total ?? 0)).catch(() => {})
  }, [])
  return count
}
```

- [ ] **Step 5: Create QuickActionSheet**

Create `src/components/ui/QuickActionSheet.tsx`:
```tsx
'use client'

import { useRef } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { UserPlus, FolderPlus, Upload, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon: typeof UserPlus
  href: string
  description?: string
}

const ACTIONS: QuickAction[] = [
  { label: 'Novo Cliente', icon: UserPlus, href: '/clients/new', description: 'Adicionar cliente à base' },
  { label: 'Novo Caso', icon: FolderPlus, href: '/cases/new', description: 'Registrar um novo caso' },
  { label: 'Importar CNIS', icon: Upload, href: '/tools/cnis', description: 'Upload de extrato previdenciário' },
]

interface QuickActionSheetProps {
  open: boolean
  onClose: () => void
}

export function QuickActionSheet({ open, onClose }: QuickActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useFocusTrap(open, sheetRef)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ações rápidas"
        className="relative w-full bg-white shadow-2xl animate-slide-up sm:max-w-sm sm:rounded-2xl sm:mx-4 rounded-t-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-lg text-slate-900">Ações Rápidas</h2>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 space-y-1">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={onClose}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-sans text-sm font-bold text-slate-900">{action.label}</p>
                  {action.description && (
                    <p className="font-sans text-xs text-slate-500">{action.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Lint check**

Run: `npm run lint`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/MobileBottomNav.tsx src/components/ui/QuickActionSheet.tsx src/hooks/useClientCount.ts src/hooks/usePendingCasesCount.ts
git commit -m "feat: improve mobile bottom nav with badges and search trigger"
```

---

### Task 2: Sidebar Desktop — avatar + modo ícones + recentes + shortcuts

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Create: `src/store/recent-store.ts`

**Interfaces:**
- Consumes: `useSession()` (NextAuth, existente), `useKeyboardShortcuts` (existente)
- Produces: Sidebar com avatar, modo ícones (64px), seção Recentes, labels de shortcuts

- [ ] **Step 1: Read Sidebar.tsx** — understand current structure

Read `src/components/Sidebar.tsx`

- [ ] **Step 2: Create recent-store.ts**

Create `src/store/recent-store.ts`:
```tsx
import { create } from 'zustand'

interface RecentItem {
  type: 'client' | 'case'
  id: string
  label: string
  href: string
  visitedAt: string
}

interface RecentStore {
  items: RecentItem[]
  add: (item: Omit<RecentItem, 'visitedAt'>) => void
  clear: () => void
}

const MAX_ITEMS = 5
const STORAGE_KEY = 'sidebar-recents'

function load(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}

function save(items: RecentItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useRecentStore = create<RecentStore>((set, get) => ({
  items: load(),
  add: (item) => set((state) => {
    const filtered = state.items.filter(i => i.id !== item.id)
    const next = [{ ...item, visitedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS)
    save(next)
    return { items: next }
  }),
  clear: () => { save([]); set({ items: [] }) },
}))
```

- [ ] **Step 3: Modify Sidebar.tsx**

Add avatar section at top (after the logo/close div):
```tsx
{/* User info */}
{session?.user && (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-serif font-bold text-amber-700 shrink-0">
      {session.user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() ?? 'U'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-sans text-sm font-bold text-slate-900 truncate">{session.user.name}</p>
      <p className="font-sans text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{session.user.plan ?? 'FREE'}</p>
    </div>
  </div>
)}
```

Add Recentes section when sidebar is open:
```tsx
{recentItems.length > 0 && isDesktopOpen && (
  <li>
    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
      Recentes
    </p>
    <ul role="list" className="ml-0 space-y-0.5">
      {recentItems.slice(0, 3).map((item) => {
        const Icon = item.type === 'client' ? Users : FolderOpen
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              prefetch={false}
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  </li>
)}
```

Add shortcut labels when sidebar is open (isDesktopOpen). Map shortcuts to NAV items:
```tsx
const SHORTCUT_LABELS: Record<string, string> = {
  '/dashboard': '⌘1',
  '/clients/list': '⌘2',
  '/cases': '⌘3',
  '/calendar': '⌘4',
}
```

Inside each nav item, add the shortcut label:
```tsx
<span className="flex-1">{item.label}</span>
{SHORTCUT_LABELS[item.href] && isDesktopOpen && (
  <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded">
    {SHORTCUT_LABELS[item.href]}
  </kbd>
)}
```

For collapsed mode (when `!isDesktopOpen`), the sidebar should show `lg:w-16` with icons only. Modify the aside classes:
```tsx
isDesktopOpen ? 'lg:w-64' : 'lg:w-16 lg:border-r lg:border-slate-200'
```

When collapsed, hide text labels:
```tsx
{isDesktopOpen ? (
  <span className="flex-1">{item.label}</span>
) : (
  <span className="sr-only">{item.label}</span>
)}
```

Also add tooltip to collapsed items:
```tsx
title={!isDesktopOpen ? item.label : undefined}
```

Add `useRecentStore` import and hook:
```tsx
import { useRecentStore } from '@/store/recent-store'
const recentItems = useRecentStore((s) => s.items)
```

- [ ] **Step 4: Update keyboard shortcuts**

Read `src/hooks/useKeyboardShortcuts.ts` and add shortcuts for ⌘1-4.

If the hook uses a key map pattern, add:
```tsx
{ key: '1', meta: true, handler: () => router.push('/dashboard') },
{ key: '2', meta: true, handler: () => router.push('/clients/list') },
{ key: '3', meta: true, handler: () => router.push('/cases') },
{ key: '4', meta: true, handler: () => router.push('/calendar') },
```

- [ ] **Step 5: Add trackRecent to CaseLayoutClient**

Read `src/app/(dashboard)/cases/[id]/_components/CaseLayoutClient.tsx` and find where to call `useRecentStore.getState().add()`. Add after load:

```tsx
useEffect(() => {
  if (caseData?.id && caseData?.client?.name) {
    useRecentStore.getState().add({
      type: 'case',
      id: caseData.id,
      label: `${BENEFIT_LABELS[caseData.benefitType] ?? caseData.benefitType} - ${caseData.client.name}`,
      href: `/cases/${caseData.id}`,
    })
  }
}, [caseData?.id])
```

And in ClientHeader component, add similar logic.

- [ ] **Step 6: Lint check**

Run: `npm run lint`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add src/components/Sidebar.tsx src/store/recent-store.ts
git commit -m "feat: enhance sidebar with avatar, collapsed icons mode, recents, and shortcuts"
```

---

### Task 3: Busca Global (Cmd+K)

**Files:**
- Create: `src/store/search-store.ts`
- Create: `src/components/search/GlobalSearch.tsx`
- Create: `src/components/search/SearchResultItem.tsx`
- Create: `src/app/api/search/route.ts`
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `useSearchStore`, `useKeyboardShortcuts`
- Produces: Modal de busca global com resultados categorizados

- [ ] **Step 1: Create search store**

Create `src/store/search-store.ts`:
```tsx
import { create } from 'zustand'

interface SearchStore {
  open: boolean
  toggle: () => void
  openSearch: () => void
  close: () => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  openSearch: () => set({ open: true }),
  close: () => set({ open: false }),
}))
```

- [ ] **Step 2: Create API route**

Create `src/app/api/search/route.ts`:
```tsx
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ clients: [], cases: [] })

  const userId = session.user.id

  const [clients, cases] = await Promise.all([
    prisma.client.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { cpf: { contains: q } },
        ],
      },
      select: { id: true, name: true, cpf: true },
      take: 5,
    }),
    prisma.case.findMany({
      where: {
        userId,
        OR: [
          { benefitType: { contains: q, mode: 'insensitive' } },
          { client: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: { id: true, benefitType: true, client: { select: { name: true } } },
      take: 5,
    }),
  ])

  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      label: c.name,
      subtitle: `CPF: ${c.cpf.slice(0, 3)}.***.***-${c.cpf.slice(-2)}`,
      href: `/clients/list/${c.id}`,
    })),
    cases: cases.map((c) => ({
      id: c.id,
      label: c.benefitType,
      subtitle: c.client.name,
      href: `/cases/${c.id}`,
    })),
  })
}
```

- [ ] **Step 3: Create SearchResultItem component**

Create `src/components/search/SearchResultItem.tsx`:
```tsx
interface SearchResultItemProps {
  icon: React.ReactNode
  label: string
  subtitle?: string
  href: string
  isActive: boolean
  onSelect: () => void
}

export function SearchResultItem({ icon, label, subtitle, isActive, onSelect }: SearchResultItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isActive ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-700'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-bold truncate">{label}</p>
        {subtitle && <p className="font-sans text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
    </button>
  )
}
```

- [ ] **Step 4: Create GlobalSearch component**

Create `src/components/search/GlobalSearch.tsx`:
```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, FolderOpen, Zap, FileText, X } from 'lucide-react'
import { useSearchStore } from '@/store/search-store'
import { searchApi } from '@/lib/api'
import { useRecentStore } from '@/store/recent-store'
import { SearchResultItem } from './SearchResultItem'

const QUICK_ACTIONS = [
  { label: 'Novo Cliente', icon: Users, href: '/clients/new' },
  { label: 'Novo Caso', icon: FolderOpen, href: '/cases/new' },
  { label: 'Importar CNIS', icon: FileText, href: '/tools/cnis' },
]

const PAGES = [
  { label: 'Dashboard', icon: Search, href: '/dashboard' },
  { label: 'Clientes', icon: Users, href: '/clients/list' },
  { label: 'Honorários', icon: Search, href: '/honorarios' },
  { label: 'Calendário', icon: Search, href: '/calendar' },
  { label: 'Relatórios', icon: Search, href: '/reports' },
  { label: 'Configurações', icon: Search, href: '/settings/profile' },
]

export function GlobalSearch() {
  const { open, close } = useSearchStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ clients: any[]; cases: any[] }>({ clients: [], cases: [] })
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout>()

  const allResults = [
    ...results.clients.map(r => ({ ...r, category: 'client' })),
    ...results.cases.map(r => ({ ...r, category: 'case' })),
    ...(query.length === 0 ? [] : PAGES.filter(p =>
      p.label.toLowerCase().includes(query.toLowerCase())
    ).map(p => ({ ...p, category: 'page', id: p.href, subtitle: '' }))),
  ]

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults({ clients: [], cases: [] }); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data)
      } catch { setResults({ clients: [], cases: [] }) }
      setLoading(false)
    }, 300)
  }, [])

  const handleSelect = useCallback((item: any) => {
    if (item.category === 'client' || item.category === 'case') {
      useRecentStore.getState().add({
        type: item.category,
        id: item.id,
        label: item.label,
        href: item.href,
      })
    }
    close()
    router.push(item.href)
  }, [router, close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    if (!open) { setQuery(''); setResults({ clients: [], cases: [] }) }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) { close(); return }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        useSearchStore.getState().toggle()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, close])

  useEffect(() => { setActiveIdx(0) }, [query, results])

  if (!open) return null

  const totalItems = allResults.length + QUICK_ACTIONS.length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, totalItems - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx < allResults.length) handleSelect(allResults[activeIdx])
      else handleSelect(QUICK_ACTIONS[activeIdx - allResults.length])
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} aria-hidden="true" />
      <div
        className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar clientes, casos, páginas..."
            className="flex-1 text-base font-sans bg-transparent outline-none placeholder:text-slate-400"
          />
          {loading && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent animate-spin rounded-full" />}
          <button onClick={close} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60dvh] overflow-y-auto p-2 space-y-3">
          {query.length < 2 && (
            <>
              <Section title="Ações Rápidas" icon={Zap}>
                {QUICK_ACTIONS.map((action, i) => (
                  <SearchResultItem
                    key={action.href}
                    icon={<action.icon className="w-4 h-4 text-slate-500" />}
                    label={action.label}
                    href={action.href}
                    isActive={activeIdx === allResults.length + i}
                    onSelect={() => handleSelect({ ...action, href: action.href })}
                  />
                ))}
              </Section>
            </>
          )}

          {results.clients.length > 0 && (
            <Section title="Clientes" icon={Users}>
              {results.clients.map((r, i) => (
                <SearchResultItem
                  key={r.id}
                  icon={<Users className="w-4 h-4 text-slate-500" />}
                  label={r.label}
                  subtitle={r.subtitle}
                  href={r.href}
                  isActive={activeIdx === i}
                  onSelect={() => handleSelect(r)}
                />
              ))}
            </Section>
          )}

          {results.cases.length > 0 && (
            <Section title="Casos" icon={FolderOpen}>
              {results.cases.map((r, i) => (
                <SearchResultItem
                  key={r.id}
                  icon={<FolderOpen className="w-4 h-4 text-slate-500" />}
                  label={r.label}
                  subtitle={r.subtitle}
                  href={r.href}
                  isActive={activeIdx === results.clients.length + i}
                  onSelect={() => handleSelect(r)}
                />
              ))}
            </Section>
          )}

          {query.length >= 2 && allResults.length === 0 && !loading && (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="font-sans text-sm font-semibold text-slate-500">Nenhum resultado</p>
              <p className="font-sans text-xs text-slate-400 mt-1">Tente termos diferentes</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[10px] text-slate-400"><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">↑↓</kbd> Navegar</span>
          <span className="text-[10px] text-slate-400"><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">↵</kbd> Abrir</span>
          <span className="text-[10px] text-slate-400"><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">ESC</kbd> Fechar</span>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}
```

- [ ] **Step 5: Integrate into Header**

Modify `src/components/Header.tsx` to add a search trigger button:

Find the search area in Header. Add a search button that opens the global search:
```tsx
<button
  onClick={() => useSearchStore.getState().openSearch()}
  className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
  aria-label="Buscar (⌘K)"
>
  <Search className="w-4 h-4" />
  <span className="hidden sm:inline text-xs font-semibold text-slate-400">Buscar</span>
  <kbd className="hidden lg:inline-flex px-1 py-0.5 text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded">⌘K</kbd>
</button>
```

Also add GlobalSearch component to the dashboard layout.

- [ ] **Step 6: Add GlobalSearch to dashboard layout**

Read `src/app/(dashboard)/layout.tsx` and add `<GlobalSearch />` before the closing tag.

- [ ] **Step 7: Lint check**

Run: `npm run lint`
Expected: No new errors

- [ ] **Step 8: Commit**

```bash
git add src/store/search-store.ts src/components/search/ src/app/api/search/ src/components/Header.tsx
git commit -m "feat: add global search with Cmd+K, API search, and result categories"
```

---

### Task 4: Unificar Calendário + Prazos

**Files:**
- Modify: `src/components/Sidebar.tsx` — badge no Agenda, remover Prazos
- Modify: `src/components/ui/MobileBottomNav.tsx` — badge de urgentes no Agenda

- [ ] **Step 1: Remove "Prazos" from sidebar and add badge to "Agenda"**

In `Sidebar.tsx`:
- Remove the `{ href: '/deadlines', label: 'Prazos', icon: Calendar }` item from NAV_SECTIONS
- Add `badge: 'deadlines'` to the calendar item:
```tsx
{ href: '/calendar', label: 'Agenda', icon: CalendarDays, badge: 'deadlines' as const },
```
- In the nav item rendering, add badge logic for deadlines:
```tsx
{item.badge === 'deadlines' && urgentDeadlines > 0 && (
  <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
    {urgentDeadlines > 9 ? '9+' : urgentDeadlines}
  </span>
)}
```

- [ ] **Step 2: Update deadines redirect or not-found**

Create a simple redirect at `/deadlines` or update the page to redirect to `/calendar`.

Read `src/app/(dashboard)/deadlines/page.tsx` and change it to:
```tsx
import { redirect } from 'next/navigation'

export default function DeadlinesRedirect() {
  redirect('/calendar')
}
```

- [ ] **Step 3: Lint check**

Run: `npm run lint`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/components/ui/MobileBottomNav.tsx src/app/(dashboard)/deadlines/page.tsx
git commit -m "refactor: unify calendar and deadlines, add badge to agenda"
```
