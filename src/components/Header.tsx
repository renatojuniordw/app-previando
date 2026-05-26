'use client'

import { Bell, Search } from 'lucide-react'
import { useSession } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar casos, clientes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 text-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-500 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-slate-200"></div>
        <button className="flex items-center gap-3 hover:bg-slate-50 py-1.5 px-3 rounded-full transition-colors">
          <div className="flex flex-col items-end">
            <span className="font-sans font-semibold text-sm text-slate-900 leading-none">
              {session?.user?.name || 'Usuário'}
            </span>
            <span className="font-sans text-xs text-slate-500 mt-1">Advogado</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-700 font-serif font-bold text-sm">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>
      </div>
    </header>
  )
}
