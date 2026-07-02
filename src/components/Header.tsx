'use client'

import { Bell, Search, X, ArrowRight, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSidebarStore } from '@/store/sidebar'

interface AppNotification {
  id: string
  type: string
  caseId: string | null
  message: string
  read: boolean
  createdAt: string
}

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toggle: toggleSidebar, isOpen: sidebarOpen, isDesktopOpen } = useSidebarStore()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()

      // Disparar notificações do navegador apenas para as novas não lidas
      setNotifications((prev) => {
        if (prev.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const newUnread = (data.notifications as AppNotification[]).filter(
            (n) => !n.read && !prev.some((p) => p.id === n.id)
          )
          newUnread.forEach((n) => {
            try {
              new Notification('Previando', {
                body: n.message,
              })
            } catch (err) {
              console.error('Erro ao disparar notificação nativa:', err)
            }
          })
        }
        return data.notifications
      })

      setUnreadCount(data.unreadCount)
    } catch {
      // Silenciar erros de polling — o usuário não precisa ser incomodado por falhas temporárias
    }
  }

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  return (        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0" role="banner">
      {/* Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) toggleSidebar()
            else useSidebarStore.getState().toggleDesktop()
          }}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors -ml-1.5"
          aria-label="Alternar menu de navegação"
          aria-expanded={mounted && window.innerWidth >= 1024 ? isDesktopOpen : sidebarOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`)
              }
            }}
            placeholder="Pesquisar casos, clientes..."
            aria-label="Pesquisar casos por nome do cliente"
            className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 text-slate-900"
          />
          {searchQuery.trim() && (
            <button
              onClick={() => {
                router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`)
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white rounded-full transition-colors"
              aria-label={`Pesquisar por "${searchQuery.trim()}"`}
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-500 transition-colors relative"
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden" role="listbox" aria-label="Notificações">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-900">Notificações</span>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar notificações">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Nenhuma notificação</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex gap-3 items-start cursor-pointer hover:bg-slate-50 transition-colors ${n.read ? 'opacity-60' : ''}`}
                      onClick={() => !n.read && markAsRead(n.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!n.read) markAsRead(n.id) } }}
                      role="option"
                      aria-selected={n.read}
                      tabIndex={0}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        {n.caseId && (
                          <Link
                            href={`/cases/${n.caseId}`}
                            className="text-xs text-amber-600 hover:underline mt-0.5 inline-block"
                            onClick={() => setOpen(false)}
                          >
                            Ver caso →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200"></div>
        <button
          className="flex items-center gap-3 hover:bg-slate-50 py-1.5 px-3 rounded-full transition-colors"
          aria-label="Perfil do usuário"
          onClick={() => router.push('/settings/profile')}
        >
          <div className="flex flex-col items-end">
            <span className="font-sans font-semibold text-sm text-slate-900 leading-none">
              {session?.user?.name || 'Usuário'}
            </span>
            <span className="font-sans text-xs text-slate-500 mt-1">{session?.user?.isAdmin ? 'Administrador' : 'Advogado'}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-700 font-serif font-bold text-sm">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>
      </div>
    </header>
  )
}
