'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAdminSidebarStore } from '@/store/admin-sidebar'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Menu, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isOpen, toggle, close } = useAdminSidebarStore()
  useBodyScrollLock(isOpen)

  useEffect(() => {
    close()
  }, [pathname, close])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    },
    [close]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <div className="flex min-h-dvh bg-slate-900 font-sans text-slate-900">
      {/* Overlay backdrop - mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col',
          'transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Navegação administrativa"
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex flex-col">
            <span className="font-serif font-bold text-2xl text-white tracking-tight leading-none">
              PREVI<span className="text-amber-500">ANDO</span>
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">Admin Panel</span>
          </div>
          <button
            onClick={close}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Navegação administrativa">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu</p>
          <AdminNav />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 font-sans font-medium text-sm text-slate-400 hover:text-white transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">Administração</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto neo-scroll">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
