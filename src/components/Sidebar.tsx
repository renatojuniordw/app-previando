'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Calendar,
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
      { href: '/calendar', label: 'Calendário', icon: CalendarDays },
      { href: '/deadlines', label: 'Prazos', icon: Calendar },
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

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin
  const { isOpen, close, isDesktopOpen } = useSidebarStore()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  useBodyScrollLock(isOpen && isMobile)
  const urgentDeadlines = useUrgentDeadlines()

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
          isDesktopOpen ? 'lg:w-64' : 'lg:w-0 lg:border-none'
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

          <nav className="flex-1 overflow-y-auto p-3" aria-label="Seções do sistema">
            <ul role="list" className="space-y-1">
              {NAV_SECTIONS.map((section) => (
                <li key={section.label}>
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {section.label}
                  </p>
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
                            <span className="flex-1">{item.label}</span>
                            {item.href === '/deadlines' && urgentDeadlines > 0 && (
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

              {isAdmin && (
                <li>
                  <hr className="my-2 border-slate-200" />
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                    {ADMIN_SECTION.label}
                  </p>
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
                            <span className="flex-1">{item.label}</span>
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
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
})
