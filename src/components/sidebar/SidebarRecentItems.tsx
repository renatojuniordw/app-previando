'use client'

import Link from 'next/link'
import { Users, FolderOpen, type LucideIcon } from 'lucide-react'
import { useRecentStore } from '@/store/recent-store'
import { useSidebarStore } from '@/store/sidebar'

const ICON_MAP: Record<string, LucideIcon> = {
  client: Users,
  case: FolderOpen,
}

interface SidebarRecentItemsProps {
  onNavigate: () => void
}

export function SidebarRecentItems(_props: SidebarRecentItemsProps) {
  const recentItems = useRecentStore((s) => s.items)
  const { isDesktopOpen } = useSidebarStore()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const showFullSidebar = isDesktopOpen || isMobile

  if (recentItems.length === 0 || !showFullSidebar) {
    return null
  }

  return (
    <li>
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Recentes
      </p>
      <ul role="list" className="ml-0 space-y-0.5">
        {recentItems.slice(0, 3).map((item) => {
          const Icon = ICON_MAP[item.type] ?? FolderOpen
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                prefetch={false}
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </li>
  )
}
