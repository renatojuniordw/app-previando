'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { UsageBar } from '@/components/UsageBar'
import { useSidebarStore } from '@/store/sidebar'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { memo, useEffect, useCallback } from 'react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { SidebarNav } from '@/components/sidebar/SidebarNav'
import { SidebarUserInfo } from '@/components/sidebar/SidebarUserInfo'
import { SidebarRecentItems } from '@/components/sidebar/SidebarRecentItems'

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin
  const { isOpen, close, isDesktopOpen } = useSidebarStore()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const showFullSidebar = isDesktopOpen || isMobile
  useBodyScrollLock(isOpen && isMobile)

  const router = useRouter()
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
              {showFullSidebar ? (
                <>
                  <span className="font-serif text-2xl font-bold leading-none tracking-tight text-slate-900">
                    PREVI<span className="text-amber-600">ANDO</span>
                  </span>
                  <span className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Previdência
                  </span>
                </>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
                  <span className="font-serif font-bold text-sm text-white">PA</span>
                </div>
              )}
            </Link>
            <button
              onClick={handleClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {session?.user && (
            <SidebarUserInfo
              user={{
                name: session.user.name ?? undefined,
                email: session.user.email ?? undefined,
                image: session.user.image ?? undefined,
                plan: session.user.plan ?? undefined,
              }}
              onSignOut={handleSignOut}
            />
          )}

          <nav className="flex-1 overflow-y-auto p-3" aria-label="Seções do sistema">
            <ul role="list" className="space-y-1">
              <SidebarNav isAdmin={!!isAdmin} onNavigate={handleClose} />
              <SidebarRecentItems onNavigate={handleClose} />
            </ul>
          </nav>

          <div className="mt-auto">
            <UsageBar />
          </div>
        </div>
      </aside>
    </>
  )
})
