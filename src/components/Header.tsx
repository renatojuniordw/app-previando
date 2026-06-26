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
  const { toggle: toggleSidebar } = useSidebarStore()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      // Silenciar erros de polling
    }
  }

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  return (
    <header
      className="h-16 flex align-items-center justify-content-between px-4 sm:px-6 shrink-0"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
      role="banner"
    >
      {/* Hamburger + Search */}
      <div className="flex align-items-center gap-3 flex-1">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) toggleSidebar()
            else useSidebarStore.getState().toggleDesktop()
          }}
          className="w-10 h-10 flex align-items-center justify-content-center rounded-lg transition-colors -ml-1.5"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Alternar menu de navegação"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-card-inner)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
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
            className="neo-input-neo w-full pl-9 pr-12 py-2 rounded-full text-sm"
          />
          {searchQuery.trim() && (
            <button
              onClick={() => {
                router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`)
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex align-items-center justify-content-center rounded-full transition-colors"
              style={{ background: 'var(--color-primary)', color: '#FFFFFF' }}
              aria-label={`Pesquisar por "${searchQuery.trim()}"`}
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex align-items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-10 h-10 flex align-items-center justify-content-center rounded-full transition-colors relative"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-card-inner)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute top-2 right-2 min-w-[16px] h-4 px-0.5 text-white text-[10px] font-bold rounded-full flex align-items-center justify-content-center border-2 leading-none"
                style={{ background: '#DC2626', borderColor: 'var(--color-surface)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-12 w-80 z-50 overflow-hidden"
              style={{
                background: 'var(--color-card-bg)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-neu-lg)',
              }}
            >
              <div className="flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Notificações</span>
                <button onClick={() => setOpen(false)} style={{ color: 'var(--color-text-muted)' }} aria-label="Fechar notificações">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Nenhuma notificação</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 flex gap-3 align-items-start cursor-pointer transition-colors"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        opacity: n.read ? 0.6 : 1,
                      }}
                      onClick={() => !n.read && markAsRead(n.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: n.read ? 'var(--color-text-muted)' : 'var(--color-primary)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{n.message}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(n.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        {n.caseId && (
                          <Link
                            href={`/cases/${n.caseId}`}
                            className="text-xs mt-0.5 inline-block"
                            style={{ color: 'var(--color-primary)' }}
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

        <div className="h-8 w-px" style={{ background: 'var(--color-border)' }}></div>
        <button
          className="flex align-items-center gap-3 py-1.5 px-3 rounded-full transition-colors"
          aria-label="Perfil do usuário"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-card-inner)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <div className="flex flex-column align-items-end">
            <span className="font-sans font-semibold text-sm leading-none" style={{ color: 'var(--color-text-primary)' }}>
              {session?.user?.name || 'Usuário'}
            </span>
            <span className="font-sans text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Advogado</span>
          </div>
          <div
            className="w-9 h-9 rounded-full flex align-items-center justify-content-center font-serif font-bold text-sm"
            style={{
              background: 'var(--color-primary-tint)',
              border: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
            }}
          >
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>
      </div>
    </header>
  )
}
