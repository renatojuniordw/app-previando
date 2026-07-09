import { Briefcase, Clock, CheckCircle } from 'lucide-react'

interface Props {
  total: number
  active: number
  finished: number
}

export function ClientCaseStatsCards({ total, active, finished }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 hover:shadow-sm transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-50 border border-slate-250 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
          <Briefcase className="w-4 h-4" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
          <p className="font-mono font-bold text-lg sm:text-xl text-slate-900">{total}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 hover:shadow-sm transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
          <Clock className="w-4 h-4" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Andamento</p>
          <p className="font-mono font-bold text-lg sm:text-xl text-slate-900">{active}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 hover:shadow-sm transition-shadow">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold tracking-wider">Finalizados</p>
          <p className="font-mono font-bold text-lg sm:text-xl text-slate-900">{finished}</p>
        </div>
      </div>
    </div>
  )
}
