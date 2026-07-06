import { Briefcase, Clock, CheckCircle } from 'lucide-react'

interface Props {
  total: number
  active: number
  finished: number
}

export function ClientCaseStatsCards({ total, active, finished }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-250 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total de Casos</p>
          <p className="font-mono font-bold text-2xl text-slate-900 mt-0.5">{total}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Em Andamento</p>
          <p className="font-mono font-bold text-2xl text-slate-900 mt-0.5">{active}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Finalizados</p>
          <p className="font-mono font-bold text-2xl text-slate-900 mt-0.5">{finished}</p>
        </div>
      </div>
    </div>
  )
}
