'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Columns, CreditCard, Settings, LogOut } from 'lucide-react'
import { UsageBar } from '@/components/UsageBar'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients/list', label: 'Clientes', icon: Users },
  { href: '/clients/kanban', label: 'Kanban', icon: Columns },
  { href: '/settings/billing', label: 'Plano', icon: CreditCard },
  { href: '/settings/profile', label: 'Perfil', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Link href="/dashboard" className="flex flex-col">
          <span className="font-serif font-bold text-2xl text-slate-900 tracking-tight leading-none">
            PREVI<span className="text-amber-600">ANDO</span>
          </span>
          <span className="font-sans text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-semibold">Previdência</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 font-sans font-medium text-sm transition-all rounded-lg',
                active
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-amber-600" : "text-slate-400")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <UsageBar />
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 font-sans font-medium text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </div>
    </aside>
  )
}
