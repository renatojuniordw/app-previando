import { AlertCircle, Calendar, ChevronDown, ChevronUp, Edit3, Plus, X } from 'lucide-react'
import { Periodo, PeriodWarning } from '../_types'
import { formatCompetencia, formatCurrency, formatDateString } from '../_utils'
import { getIndicatorDetails } from '@/services/cnis/indicatorsDictionary'

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

export function PeriodItem({
  periodo,
  isExpanded,
  warnings,
  onToggle,
  onEdit,
  onEditSalaries,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/50">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 space-y-1.5 text-left focus-visible:outline-none"
          aria-expanded={isExpanded}
          aria-label={`Visualizar salários de ${periodo.empregador}`}
        >
          <h5 className="flex items-center gap-2 truncate font-sans text-sm font-bold tracking-tight text-slate-800 sm:text-base">
            {periodo.empregador || 'EMPREGADOR NÃO INFORMADO'}
            {warnings.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold cursor-help shrink-0 ${
                  warnings.some(w => w.type === 'warning')
                    ? 'border border-red-100 bg-red-50 text-red-700'
                    : 'border border-amber-100 bg-amber-50 text-amber-700'
                }`}
                title={warnings.map(w => w.message).join(' · ')}
              >
                {warnings.length} {warnings.some(w => w.type === 'warning') ? 'pendência' : 'aviso'}
                {warnings.length > 1 ? 's' : ''}
              </span>
            )}
          </h5>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {formatDateString(periodo.inicio)} a{' '}
              {periodo.fim ? formatDateString(periodo.fim) : 'Em andamento'}
            </span>
            {periodo.salarios && periodo.salarios.length > 0 && (
              <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {periodo.salarios.length} contribuições
              </span>
            )}
            {periodo.indicadores && periodo.indicadores.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {periodo.indicadores.map((ind, iIdx) => {
                  const details = getIndicatorDetails(ind)
                  return (
                    <span
                      key={iIdx}
                      title={`${ind}: ${details.descricao}`}
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        details.critico
                          ? 'border border-red-100 bg-red-50 text-red-700'
                          : 'border border-amber-100 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ind}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Editar vínculo"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={onEditSalaries}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Gerenciar salários"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            title="Remover vínculo"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-hidden="true"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-amber-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && warnings.length > 0 && (
        <div className="space-y-1 border-t border-slate-100 bg-amber-50/40 px-5 py-2.5">
          {warnings.map((w, wIdx) => (
            <div
              key={wIdx}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-800"
            >
              <AlertCircle
                className={`h-3.5 w-3.5 shrink-0 ${w.type === 'warning' ? 'text-red-500' : 'text-amber-500'}`}
              />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="border-slate-200 animate-slide-down border-t bg-slate-50/30 px-5 py-5">
          {periodo.salarios && periodo.salarios.length > 0 ? (
            <div className="space-y-3">
              <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Detalhamento de Salários
              </span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {periodo.salarios.map((sal, sIdx) => (
                  <div
                    key={sIdx}
                    className="border-slate-200 hover:border-slate-350 group/sal relative flex flex-col justify-between rounded-xl border bg-white p-3 shadow-sm transition-all"
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="font-sans text-[10px] font-bold text-slate-400">
                        {formatCompetencia(sal.competencia)}
                      </span>
                      {sal.indicadores && sal.indicadores.length > 0 && (
                        <div className="flex max-w-[50%] shrink-0 gap-0.5 overflow-hidden">
                          {sal.indicadores.map((ind, iIdx) => {
                            const details = getIndicatorDetails(ind)
                            return (
                              <span
                                key={iIdx}
                                title={`${ind}: ${details.descricao}`}
                                className={`cursor-help rounded-sm px-1 text-[8px] font-extrabold ${
                                  details.critico
                                    ? 'border-red-200 border bg-red-50 text-red-700'
                                    : 'border-amber-200 border bg-amber-50 text-amber-700'
                                }`}
                              >
                                {ind}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 font-sans text-xs font-bold tabular-nums text-slate-800 sm:text-sm">
                      {formatCurrency(sal.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-500 sm:text-sm">
              <AlertCircle className="text-slate-400 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Nenhum salário de contribuição registrado ou extraído para este período. Adicione
                salários clicando no botão de &quot;+&quot; acima.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
