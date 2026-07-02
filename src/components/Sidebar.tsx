'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Columns, CreditCard, Settings, LogOut, Activity, Calendar, FolderOpen, X, BookOpen, Files, BarChart3, DollarSign, Tags, Package } from 'lucide-react'
import { UsageBar } from '@/components/UsageBar'
import { useSidebarStore } from '@/store/sidebar'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useUrgentDeadlines } from '@/hooks/useUrgentDeadlines'
import { useEffect, useCallback } from 'react'

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
    ],
  },
]

const ADMIN_SECTION = {
  label: 'Administração',
  items: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/payments', label: 'Pagamentos', icon: CreditCard },
    { href: '/admin/metrics', label: 'Métricas', icon: Activity },
    { href: '/admin/plans', label: 'Planos', icon: Package },
    { href: '/admin/salario-minimo', label: 'Salário Mínimo', icon: DollarSign },
    { href: '/admin/modalidades', label: 'Modalidades', icon: Tags },
    { href: '/admin/regras-aposentadoria', label: 'Regras Previdenciárias', icon: BookOpen },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin
  const { isOpen, close, isDesktopOpen } = useSidebarStore()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  useBodyScrollLock(isOpen && isMobile)
  const urgentDeadlines = useUrgentDeadlines()

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) close()
  }, [pathname, close])

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
  }, [close])

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
          className="fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 z-20 transition-all duration-300 overflow-hidden',
          'fixed inset-y-0 left-0 z-40 transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isDesktopOpen ? 'lg:w-64' : 'lg:w-0 lg:border-none'
        )}
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="w-64 h-full flex flex-col">
        {/* Logo + Close button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex flex-col">
            <span className="font-serif font-bold text-2xl text-slate-900 tracking-tight leading-none">
              PREVI<span className="text-amber-600">ANDO</span>
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">Previdência</span>
          </Link>
          <button
            onClick={close}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto" aria-label="Seções do sistema">
          <ul role="list" className="space-y-1">
            {NAV_SECTIONS.map((section) => (
              <li key={section.label}>
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.label}
                </p>
                <ul role="list" className="space-y-0.5 ml-0">
                  {section.items.map((item) => {
                    const active = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-label={item.label}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 min-h-[44px] font-sans font-medium text-sm transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                            active
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          )}
                        >
                          <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-amber-600' : 'text-slate-400')} aria-hidden="true" />
                          <span className="flex-1">{item.label}</span>
                          {item.href === '/deadlines' && urgentDeadlines > 0 && (
                            <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
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
                <p className="px-3 py-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  {ADMIN_SECTION.label}
                </p>
                <ul role="list" className="space-y-0.5 ml-0">
                  {ADMIN_SECTION.items.map((item) => {
                    const active = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-label={item.label}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 min-h-[44px] font-sans font-medium text-sm transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                            active
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          )}
                        >
                          <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-amber-600' : 'text-slate-400')} aria-hidden="true" />
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
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center gap-2 px-3 min-h-[44px] font-sans font-medium text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
        </div>
      </aside>
    </>
  )
}
