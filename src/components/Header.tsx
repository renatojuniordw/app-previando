'use client'

import { Search, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { memo, useEffect, useState } from 'react'
import { useSearchStore } from '@/store/search-store'
import { useSidebarStore } from '@/store/sidebar'
import { NotificationDropdown } from './header/NotificationDropdown'
import { MobileSearchOverlay } from './header/MobileSearchOverlay'
import { UserProfileButton } from './header/UserProfileButton'

export const Header = memo(function Header() {
  const { data: session } = useSession()
  const { toggle: toggleSidebar, isOpen: sidebarOpen, isDesktopOpen } = useSidebarStore()
  const [mounted, setMounted] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0" role="banner">
        {/* Hamburger + Search */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) toggleSidebar()
              else useSidebarStore.getState().toggleDesktop()
            }}
            className="hidden lg:flex min-w-[44px] min-h-[44px] items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors -ml-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            aria-label="Alternar menu de navegação"
            aria-expanded={mounted && window.innerWidth >= 1024 ? isDesktopOpen : sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global search trigger (Cmd+K) — fake search bar */}
          <button
            onClick={() => useSearchStore.getState().openSearch()}
            className="hidden sm:flex flex-1 max-w-md min-h-[44px] items-center gap-3 px-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-400 transition-all shadow-xs group"
            aria-label="Buscar (⌘K)"
          >
            <Search className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-500" />
            <span className="flex-1 text-left text-sm font-sans font-medium text-slate-400 group-hover:text-slate-500 truncate">Buscar clientes, casos...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">⌘K</kbd>
          </button>

          {/* Mobile search trigger */}
          <button
            onClick={() => useSearchStore.getState().openSearch()}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Buscar (⌘K)"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {session?.user && (
            <NotificationDropdown
              userId={session.user.id}
              plan={session.user.plan}
            />
          )}

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          <UserProfileButton
            user={{
              name: session?.user?.name,
              email: session?.user?.email,
              image: session?.user?.image,
              isAdmin: session?.user?.isAdmin,
            }}
          />
        </div>
      </header>

      <MobileSearchOverlay
        open={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />
    </>
  )
})
