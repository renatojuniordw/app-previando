'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, FolderOpen, Zap, FileText, X, LayoutDashboard, DollarSign, CalendarDays, BarChart3, Settings } from 'lucide-react'
import { useSearchStore } from '@/store/search-store'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useRecentStore } from '@/store/recent-store'
import { SearchResultItem } from './SearchResultItem'

const QUICK_ACTIONS = [
  { label: 'Novo Cliente', icon: Users, href: '/clients/new' },
  { label: 'Novo Caso', icon: FolderOpen, href: '/cases/new' },
  { label: 'Importar CNIS', icon: FileText, href: '/tools/cnis' },
]

const PAGES = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Clientes', icon: Users, href: '/clients/list' },
  { label: 'Honorários', icon: DollarSign, href: '/honorarios' },
  { label: 'Calendário', icon: CalendarDays, href: '/calendar' },
  { label: 'Relatórios', icon: BarChart3, href: '/reports' },
  { label: 'Configurações', icon: Settings, href: '/settings/profile' },
]

export function GlobalSearch() {
  const { open, close } = useSearchStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ clients: any[]; cases: any[] }>({ clients: [], cases: [] })
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef)
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
        ref={dialogRef}
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
