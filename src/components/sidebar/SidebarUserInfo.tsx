'use client'

import { LogOut } from 'lucide-react'
import { useSidebarStore } from '@/store/sidebar'

interface SidebarUserInfoUser {
  name?: string
  email?: string
  image?: string
  plan?: string
}

interface SidebarUserInfoProps {
  user: SidebarUserInfoUser
  onSignOut: () => void
}

export function SidebarUserInfo({ user, onSignOut }: SidebarUserInfoProps) {
  const { isDesktopOpen } = useSidebarStore()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const showFullSidebar = isDesktopOpen || isMobile

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() ?? 'U'

  return (
    <div className="border-b border-slate-100">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-serif font-bold text-amber-700 shrink-0">
          {initials}
        </div>
        {showFullSidebar && (
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-bold text-slate-900 truncate">
              {user.name}
            </p>
            <p className="font-sans text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {user.plan ?? 'FREE'}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        <button
          onClick={onSignOut}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-3 font-sans text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          aria-label="Sair da conta"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {showFullSidebar && <span>Sair da Conta</span>}
        </button>
      </div>
    </div>
  )
}
