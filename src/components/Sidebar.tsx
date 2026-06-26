'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Columns, CreditCard, Settings, LogOut, Activity, Calendar, FolderOpen, X, Instagram } from 'lucide-react'
import { UsageBar } from '@/components/UsageBar'
import { useSidebarStore } from '@/store/sidebar'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useUrgentDeadlines } from '@/hooks/useUrgentDeadlines'
import { useEffect, useCallback } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients/list', label: 'Clientes', icon: Users },
  { href: '/clients/kanban', label: 'Kanban', icon: Columns },
  { href: '/cases', label: 'Casos', icon: FolderOpen },
  { href: '/deadlines', label: 'Prazos', icon: Calendar },
  { href: '/activity', label: 'Atividade', icon: Activity },
  { href: '/tools/social-media', label: 'Carrossel BPC', icon: Instagram },
  { href: '/settings/billing', label: 'Plano', icon: CreditCard },
  { href: '/settings/profile', label: 'Perfil', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
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
          'shrink-0 h-screen sticky top-0 z-20 transition-all duration-300 overflow-hidden',
          'fixed inset-y-0 left-0 z-40 transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isDesktopOpen ? 'lg:w-[190px]' : 'lg:w-0'
        )}
        style={{
          background: 'var(--color-sidebar-bg)',
        }}
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="w-[190px] h-full flex flex-column">
        {/* Logo + Close button */}
        <div className="h-16 flex align-items-center justify-content-between px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/dashboard" className="flex flex-column">
            <span className="font-serif font-bold text-2xl tracking-tight leading-none" style={{ color: '#FFFFFF' }}>
              PREVI<span style={{ color: 'var(--color-primary)' }}>ANDO</span>
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest mt-1 font-semibold" style={{ color: 'var(--color-sidebar-text)' }}>
              Previdência
            </span>
          </Link>
          <button
            onClick={close}
            className="lg:hidden w-8 h-8 flex align-items-center justify-content-center rounded-lg transition-colors"
            style={{ color: 'var(--color-sidebar-text)' }}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Seções do sistema">
          <ul role="list" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className="neo-nav-item"
                    style={active ? {
                      background: 'var(--color-sidebar-active)',
                      color: 'var(--color-sidebar-text-active)',
                      fontWeight: 500,
                    } : {}}
                  >
                    <Icon className="w-5 h-5 shrink-0" style={{ color: active ? 'var(--color-primary)' : 'var(--color-sidebar-text)' }} aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/deadlines' && urgentDeadlines > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] flex align-items-center justify-content-center rounded-full text-white text-[10px] font-bold px-1" style={{ background: '#DC2626' }}>
                        {urgentDeadlines > 9 ? '9+' : urgentDeadlines}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-auto">
          <UsageBar />
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex align-items-center justify-content-center gap-2 px-3 py-2.5 font-sans font-medium text-sm rounded-lg transition-all"
              style={{ color: 'var(--color-sidebar-text)' }}
              aria-label="Sair da conta"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-sidebar-active)'
                e.currentTarget.style.color = 'var(--color-sidebar-text-active)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-sidebar-text)'
              }}
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
