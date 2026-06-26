import { AlertCircle, Calendar, ChevronDown, ChevronUp, Edit3, Plus, X } from 'lucide-react'
import { Periodo, PeriodWarning } from '../_types'
import { formatCompetencia, formatCurrency, formatDateString } from '../_utils'

interface Props {
  periodo: Periodo
  idx: number
  isExpanded: boolean
  warnings: PeriodWarning[]
  onToggle: () => void
  onEdit: () => void
  onEditSalaries: () => void
  onDelete: () => void
}

export function PeriodItem({ periodo, idx, isExpanded, warnings, onToggle, onEdit, onEditSalaries, onDelete }: Props) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      <div className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 transition-colors">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 space-y-1.5 min-w-0 text-left focus-visible:outline-none"
          aria-expanded={isExpanded}
          aria-label={`Visualizar salários de ${periodo.empregador}`}
        >
          <h5 className="font-sans font-bold text-slate-800 truncate text-sm sm:text-base tracking-tight flex items-center gap-2">
            {periodo.empregador || 'EMPREGADOR NÃO INFORMADO'}
            {warnings.length > 0 && (
              <span className="flex gap-1 shrink-0">
                {warnings.map((w, wIdx) => (
                  <span
                    key={wIdx}
                    title={w.message}
                    className={`w-2 h-2 rounded-full cursor-help ${w.type === 'warning' ? 'bg-red-500' : 'bg-amber-500'}`}
                  />
                ))}
              </span>
            )}
          </h5>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {formatDateString(periodo.inicio)} a {periodo.fim ? formatDateString(periodo.fim) : 'Em andamento'}
            </span>
            {periodo.salarios && periodo.salarios.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold">
                {periodo.salarios.length} contribuições
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onEdit} className="text-slate-400 hover:text-amber-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none" title="Editar vínculo">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={onEditSalaries} className="text-slate-400 hover:text-amber-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none" title="Gerenciar salários">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none" title="Remover vínculo">
            <X className="w-4 h-4" />
          </button>
          <button type="button" onClick={onToggle} className="text-slate-400 hover:text-amber-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none" aria-hidden="true">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
          </button>
        </div>
      </div>

      {isExpanded && warnings.length > 0 && (
        <div className="px-5 py-2.5 bg-amber-50/40 border-t border-slate-100 space-y-1">
          {warnings.map((w, wIdx) => (
            <div key={wIdx} className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${w.type === 'warning' ? 'text-red-500' : 'text-amber-500'}`} />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-slate-150 bg-slate-50/30 px-5 py-5 animate-slide-down">
          {periodo.salarios && periodo.salarios.length > 0 ? (
            <div className="space-y-3">
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Detalhamento de Salários</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {periodo.salarios.map((sal, sIdx) => (
                  <div key={sIdx} className="bg-white border border-slate-150 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-slate-350 transition-colors">
                    <span className="font-sans text-[10px] text-slate-400 font-bold">{formatCompetencia(sal.competencia)}</span>
                    <span className="font-sans font-bold text-slate-800 text-xs sm:text-sm mt-1 tabular-nums">{formatCurrency(sal.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-slate-500 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-slate-450 shrink-0" aria-hidden="true" />
              <span>Nenhum salário de contribuição registrado ou extraído para este período. Adicione salários clicando no botão de &quot;+&quot; acima.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
