'use client'

import { AlertCircle, Calendar, ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from 'lucide-react'
import { Periodo, PeriodWarning } from '../_types'
import { formatCompetencia, formatDateString } from '../_utils'
import { formatCurrency, cn } from '@/lib/utils'
import { getIndicatorDetails } from '@/services/cnis/indicatorsDictionary'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'

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
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
      <div className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        {/* Toggleable Click Area */}
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 space-y-2 text-left focus-visible:outline-none group/btn"
          aria-expanded={isExpanded}
          aria-label={`Visualizar salários de ${periodo.empregador}`}
        >
          <h3 className="flex flex-wrap items-center gap-2 truncate font-sans text-sm font-bold tracking-tight text-slate-800 group-hover/btn:text-amber-800 transition-colors sm:text-base leading-snug">
            {periodo.empregador || 'EMPREGADOR NÃO INFORMADO'}
            {warnings.length > 0 && (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider cursor-help shrink-0 border",
                  warnings.some(w => w.type === 'warning')
                    ? 'border-red-200 bg-red-50/50 text-red-700'
                    : 'border-amber-250 bg-amber-50/50 text-amber-700'
                )}
                title={warnings.map(w => w.message).join(' · ')}
              >
                {warnings.length} {warnings.some(w => w.type === 'warning') ? 'Pendente' : 'Aviso'}{warnings.length > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {formatDateString(periodo.inicio)} a{' '}
              {periodo.fim ? formatDateString(periodo.fim) : 'Em andamento'}
            </span>
            {periodo.salarios && periodo.salarios.length > 0 && (
              <span className="rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700">
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
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-extrabold border cursor-help",
                        details.critico
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-250 bg-amber-50 text-amber-700'
                      )}
                    >
                      {ind}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </button>

        {/* Consolidated Actions Dropdown (No-accidental delete, touch-friendly size) */}
        <div className="flex shrink-0 items-center gap-2">
          <ActionsDropdown 
            ariaLabel="Ações do vínculo"
            actions={[
              { label: 'Editar vínculo', icon: <Pencil className="w-4 h-4" />, onClick: onEdit },
              { label: 'Gerenciar salários', icon: <Plus className="w-4 h-4" />, onClick: onEditSalaries },
              { label: 'Excluir vínculo', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, variant: 'danger' }
            ]}
          />
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-655 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-hidden="true"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-amber-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-450" />
            )}
          </button>
        </div>
      </div>

      {/* Warnings Block */}
      {isExpanded && warnings.length > 0 && (
        <div className="border-t border-slate-100 bg-amber-50/10 px-5 py-4 space-y-3.5">
          <span className="block font-sans text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
            Pendências e Alertas do CNIS
          </span>
          <div className="space-y-2.5">
            {warnings.map((w, wIdx) => (
              <div
                key={wIdx}
                className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 leading-relaxed"
              >
                <AlertCircle
                  className={cn("h-4 w-4 shrink-0 mt-0.5", w.type === 'warning' ? 'text-red-500' : 'text-amber-500')}
                />
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Salary Detail View */}
      {isExpanded && (
        <div className="border-slate-100 animate-slide-down border-t bg-slate-50/30 px-5 py-5">
          {periodo.salarios && periodo.salarios.length > 0 ? (
            <div className="space-y-3.5">
              <span className="block font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Detalhamento de Salários de Contribuição
              </span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {periodo.salarios.map((sal, sIdx) => (
                  <div
                    key={sIdx}
                    className="border-slate-200/80 hover:border-slate-350 hover:shadow-xs group/sal relative flex flex-col justify-between rounded-xl border bg-white p-3.5 shadow-sm transition-all duration-300"
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {formatCompetencia(sal.competencia)}
                      </span>
                      {sal.indicadores && sal.indicadores.length > 0 && (
                        <div className="flex max-w-[55%] shrink-0 gap-0.5 overflow-hidden">
                          {sal.indicadores.map((ind, iIdx) => {
                            const details = getIndicatorDetails(ind)
                            return (
                              <span
                                key={iIdx}
                                title={`${ind}: ${details.descricao}`}
                                className={cn(
                                  "cursor-help rounded-sm px-1 text-[8px] font-extrabold border shrink-0",
                                  details.critico
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : 'border-amber-250 bg-amber-50 text-amber-700'
                                )}
                              >
                                {ind}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <span className="mt-2 font-mono text-sm font-bold text-slate-800 leading-none">
                      {formatCurrency(sal.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 py-2 text-xs text-slate-500 leading-relaxed font-semibold">
              <AlertCircle className="text-slate-400 h-4.5 w-4.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Nenhum salário de contribuição registrado ou extraído para este período. Você pode adicionar
                salários clicando em &quot;Gerenciar salários&quot; nas opções do vínculo acima.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
