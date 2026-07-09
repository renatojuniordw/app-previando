'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Columns,
  CreditCard,
  Settings,
  LogOut,
  Activity,
  CalendarDays,
  FolderOpen,
  X,
  BookOpen,
  Files,
  BarChart3,
  DollarSign,
  Headphones,
  Shield,
} from 'lucide-react'
import { UsageBar } from '@/components/UsageBar'
import { useSidebarStore } from '@/store/sidebar'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useUrgentDeadlines } from '@/hooks/useUrgentDeadlines'
import { memo, useEffect, useCallback } from 'react'
import { useRecentStore } from '@/store/recent-store'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/clients/list', label: 'Clientes', icon: Users },
      { href: '/clients/kanban', label: 'Kanban', icon: Columns },
      { href: '/cases', label: 'Casos', icon: FolderOpen },
    ],
  },
  {
    label: 'Acompanhamento',
    items: [
      { href: '/reports', label: 'Relatórios', icon: BarChart3 },
      { href: '/honorarios', label: 'Honorários', icon: DollarSign },
      { href: '/calendar', label: 'Agenda', icon: CalendarDays, badge: 'deadlines' as const },
      { href: '/activity', label: 'Atividade', icon: Activity },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/tools/pdf', label: 'Ferramentas de PDF', icon: Files },
      { href: '/tools/cnis-indicators', label: 'Dicionário CNIS', icon: BookOpen },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { href: '/settings/billing', label: 'Plano', icon: CreditCard },
      { href: '/settings/profile', label: 'Perfil', icon: Settings },
      { href: '/suporte', label: 'Suporte', icon: Headphones },
    ],
  },
]

const ADMIN_SECTION = {
  label: 'Administração',
  items: [
    { href: '/admin', label: 'Painel Administrativo', icon: Shield },
  ],
}

const SHORTCUT_LABELS: Record<string, string> = {
  '/dashboard': '⌘1',
  '/clients/list': '⌘2',
  '/cases': '⌘3',
  '/calendar': '⌘4',
}

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin
  const { isOpen, close, isDesktopOpen } = useSidebarStore()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  useBodyScrollLock(isOpen && isMobile)
  const urgentDeadlines = useUrgentDeadlines()

  const router = useRouter()
  const recentItems = useRecentStore((s) => s.items)
  useKeyboardShortcuts([
    { keys: ['1'], metaKey: true, description: 'Ir para Dashboard', action: () => router.push('/dashboard') },
    { keys: ['2'], metaKey: true, description: 'Ir para Clientes', action: () => router.push('/clients/list') },
    { keys: ['3'], metaKey: true, description: 'Ir para Casos', action: () => router.push('/cases') },
    { keys: ['4'], metaKey: true, description: 'Ir para Calendário', action: () => router.push('/calendar') },
  ])

  const handleClose = useCallback(() => close(), [close])
  const handleSignOut = useCallback(() => signOut({ callbackUrl: '/login' }), [])

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) close()
  }, [pathname, close])

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    },
    [close]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, handleKeyDown])

  return (
    <>
      {/* Overlay backdrop - mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'sticky top-0 z-20 h-dvh shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all duration-300',
          'fixed inset-y-0 left-0 z-40 transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isDesktopOpen ? 'lg:w-64' : 'lg:w-16'
        )}
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="flex h-full w-64 flex-col">
          {/* Logo + Close button */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
            <Link href="/dashboard" prefetch={false} className="flex flex-col">
              <span className="font-serif text-2xl font-bold leading-none tracking-tight text-slate-900">
                PREVI<span className="text-amber-600">ANDO</span>
              </span>
              <span className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Previdência
              </span>
            </Link>
            <button
              onClick={handleClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {session?.user && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-serif font-bold text-amber-700 shrink-0">
                {session.user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() ?? 'U'}
              </div>
              {isDesktopOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-bold text-slate-900 truncate">{session.user.name}</p>
                  <p className="font-sans text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{session.user.plan ?? 'FREE'}</p>
                </div>
              )}
            </div>
          )}

          <nav className="flex-1 overflow-y-auto p-3" aria-label="Seções do sistema">
            <ul role="list" className="space-y-1">
              {NAV_SECTIONS.map((section) => (
                <li key={section.label}>
                  {isDesktopOpen ? (
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {section.label}
                    </p>
                  ) : (
                    <p className="sr-only px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {section.label}
                    </p>
                  )}
                  <ul role="list" className="ml-0 space-y-0.5">
                    {section.items.map((item) => {
                      const active = pathname.startsWith(item.href)
                      const Icon = item.icon
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            prefetch={false}
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                            title={!isDesktopOpen ? item.label : undefined}
                            className={cn(
                              'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                              active
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5 shrink-0',
                                active ? 'text-amber-600' : 'text-slate-400'
                              )}
                              aria-hidden="true"
                            />
                            {isDesktopOpen ? (
                              <span className="flex-1">{item.label}</span>
                            ) : (
                              <span className="sr-only">{item.label}</span>
                            )}
                            {SHORTCUT_LABELS[item.href] && isDesktopOpen && (
                              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded">
                                {SHORTCUT_LABELS[item.href]}
                              </kbd>
                            )}
                            {item.badge === 'deadlines' && urgentDeadlines > 0 && (
                              <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {urgentDeadlines > 9 ? '9+' : urgentDeadlines}
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}

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

              {isAdmin && (
                <li>
                  <hr className="my-2 border-slate-200" />
                  {isDesktopOpen ? (
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                      {ADMIN_SECTION.label}
                    </p>
                  ) : (
                    <p className="sr-only px-3 py-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                      {ADMIN_SECTION.label}
                    </p>
                  )}
                  <ul role="list" className="ml-0 space-y-0.5">
                    {ADMIN_SECTION.items.map((item) => {
                      const active = pathname.startsWith(item.href)
                      const Icon = item.icon
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            prefetch={false}
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                            title={!isDesktopOpen ? item.label : undefined}
                            className={cn(
                              'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                              active
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5 shrink-0',
                                active ? 'text-amber-600' : 'text-slate-400'
                              )}
                              aria-hidden="true"
                            />
                            {isDesktopOpen ? (
                              <span className="flex-1">{item.label}</span>
                            ) : (
                              <span className="sr-only">{item.label}</span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )}
            </ul>
          </nav>

          <div className="mt-auto">
            <UsageBar />
            <div className="border-t border-slate-200 p-4">
              <button
                onClick={handleSignOut}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-3 font-sans text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                aria-label="Sair da conta"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {isDesktopOpen && <span>Sair da Conta</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
})
