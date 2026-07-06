import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { maskCPF } from '@/lib/sanitize'

interface Props {
  name: string
  cpf: string
}

export function ClientHeader({ name, cpf }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0 text-white font-serif font-bold text-xl">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/clients/list" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Clientes
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">{name}</h1>
          <p className="font-sans text-sm text-slate-550 mt-0.5 font-medium">CPF: {maskCPF(cpf)}</p>
        </div>
      </div>
    </div>
  )
}
