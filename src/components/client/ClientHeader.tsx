import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { maskCPF } from '@/lib/sanitize'
import { Badge } from '@/components/ui/Badge'
import { PRIORITY_LABELS } from '@/lib/constants'

interface Props {
  name: string
  cpf: string
  priority?: string
}

const PRIORITY_BADGE: Record<string, 'red' | 'yellow' | 'slate'> = {
  CRITICAL: 'red',
  ATTENTION: 'yellow',
  NORMAL: 'slate',
}

export function ClientHeader({ name, cpf, priority }: Props) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200 pb-4 sm:pb-6">
      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0 text-white font-serif font-bold text-base sm:text-xl">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
          <Link href="/clients/list" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Clientes
          </Link>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight truncate">{name}</h1>
          {priority && (
            <Badge variant={PRIORITY_BADGE[priority] ?? 'slate'}>
              {PRIORITY_LABELS[priority] ?? priority}
            </Badge>
          )}
        </div>
        <p className="font-sans text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">CPF: {maskCPF(cpf)}</p>
      </div>
    </div>
  )
}
