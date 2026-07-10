import { Briefcase, Clock, CheckCircle } from 'lucide-react'

interface Props {
  total: number
  active: number
  finished: number
}

export function ClientCaseStatsCards({ total, active, finished }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-5">
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 hover:shadow-sm transition-shadow">
        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
          <Briefcase className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-sans text-[9px] sm:text-xs text-slate-400 uppercase font-bold tracking-normal sm:tracking-wider">Total</p>
          <p className="font-mono font-bold text-base sm:text-2xl text-slate-900 -mt-0.5">{total}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 hover:shadow-sm transition-shadow">
        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
          <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-sans text-[9px] sm:text-xs text-slate-400 uppercase font-bold tracking-normal sm:tracking-wider">Andamento</p>
          <p className="font-mono font-bold text-base sm:text-2xl text-slate-900 -mt-0.5">{active}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 hover:shadow-sm transition-shadow">
        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
          <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-sans text-[9px] sm:text-xs text-slate-400 uppercase font-bold tracking-normal sm:tracking-wider">Finalizados</p>
          <p className="font-mono font-bold text-base sm:text-2xl text-slate-900 -mt-0.5">{finished}</p>
        </div>
      </div>
    </div>
  )
}
