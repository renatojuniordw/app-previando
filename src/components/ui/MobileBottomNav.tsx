'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CalendarDays,
  Search,
} from 'lucide-react'
import { useSearchStore } from '@/store/search-store'
import { useState, useRef } from 'react'
import { useUrgentDeadlines } from '@/hooks/useUrgentDeadlines'
import { QuickActionSheet } from '@/components/ui/QuickActionSheet'
import { useClientCount } from '@/hooks/useClientCount'
import { usePendingCasesCount } from '@/hooks/usePendingCasesCount'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients/list', label: 'Clientes', icon: Users, badge: 'clients' as const },
  { href: '/cases', label: 'Casos', icon: FolderOpen, badge: 'cases' as const },
  { href: '/calendar', label: 'Agenda', icon: CalendarDays, badge: 'deadlines' as const },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const urgentDeadlines = useUrgentDeadlines()
  const clientCount = useClientCount()
  const pendingCount = usePendingCasesCount()
  const [showQuickActions, setShowQuickActions] = useState(false)
  const longPressRef = useRef<NodeJS.Timeout>()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      role="navigation"
      aria-label="Navegação móvel"
    >
      <ul className="flex items-center justify-around" role="list">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-inset',
                  active
                    ? 'text-amber-700'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.badge === 'deadlines' && urgentDeadlines > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                      {urgentDeadlines > 9 ? '9+' : urgentDeadlines}
                    </span>
                  )}
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
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => useSearchStore.getState().openSearch()}
            onPointerDown={() => {
              longPressRef.current = setTimeout(() => {
                setShowQuickActions(true)
              }, 700)
            }}
            onPointerUp={() => {
              if (longPressRef.current) clearTimeout(longPressRef.current)
            }}
            onPointerLeave={() => {
              if (longPressRef.current) clearTimeout(longPressRef.current)
            }}
            aria-label="Buscar"
            className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-inset"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            <span>Buscar</span>
          </button>
        </li>
      </ul>
      <QuickActionSheet open={showQuickActions} onClose={() => setShowQuickActions(false)} />
    </nav>
  )
}
