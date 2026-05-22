'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function ClientSwitcher() {
  const pathname = usePathname()

  return (
    <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
      <Link
        href="/clients/list"
        className={cn(
          'px-6 py-2 text-sm font-medium rounded-md transition-all',
          pathname.startsWith('/clients/list')
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        Lista de Clientes
      </Link>
      <Link
        href="/clients/kanban"
        className={cn(
          'px-6 py-2 text-sm font-medium rounded-md transition-all',
          pathname.startsWith('/clients/kanban')
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        Kanban
      </Link>
    </div>
  )
}
