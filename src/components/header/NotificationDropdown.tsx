'use client'

import { Bell, X } from 'lucide-react'
import Link from 'next/link'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface AppNotification {
  id: string
  type: string
  caseId: string | null
  message: string
  read: boolean
  createdAt: string
}

interface NotificationDropdownProps {
  userId: string
  plan: string
}

export const NotificationDropdown = memo(function NotificationDropdown({
  userId: _userId,
  plan: _plan,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleToggleNotifications = useCallback(() => setOpen((o) => !o), [])

  const handleCloseNotifications = useCallback(() => setOpen(false), [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleNotifications}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-500 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
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
        <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] sm:fixed sm:inset-x-4 sm:top-16 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden" role="listbox" aria-label="Notificações">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-sm text-slate-900">Notificações</span>
            <button onClick={handleCloseNotifications} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-lg" aria-label="Fechar notificações">
              <X className="w-4 h-4" aria-hidden="true" />
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
  )
})
