'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Info,
  AlertTriangle,
  CheckCircle2,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Filter,
} from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import {
  CNIS_INDICATORS,
  IndicatorInfo,
} from '../../../../../../services/cnis/indicatorsDictionary'

interface Props {
  open: boolean
  onClose: () => void
}

const FILTERS = ['Todos', 'Pendência', 'Acerto', 'Informativo'] as const
type FilterType = (typeof FILTERS)[number]

const TYPE_VARIANT: Record<string, 'lime' | 'green' | 'blue' | 'slate'> = {
  Pendência: 'lime',
  Acerto: 'green',
  Informativo: 'blue',
  Outro: 'slate',
}

const TYPE_ICON: Record<string, typeof AlertTriangle> = {
  Pendência: AlertTriangle,
  Acerto: CheckCircle2,
  Informativo: Info,
  Outro: Info,
}

const TYPE_COLOR: Record<string, string> = {
  Pendência: 'text-amber-600',
  Acerto: 'text-green-600',
  Informativo: 'text-blue-600',
  Outro: 'text-slate-500',
}

export function CnisIndicatorsDrawer({ open, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('Todos')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const allIndicators = useMemo(() => Object.values(CNIS_INDICATORS), [])

  // Count per type for filter badges
  const countByType = useMemo(() => {
    return FILTERS.reduce<Record<FilterType, number>>(
      (acc, f) => {
        acc[f] =
          f === 'Todos' ? allIndicators.length : allIndicators.filter((i) => i.tipo === f).length
        return acc
      },
      {} as Record<FilterType, number>
    )
  }, [allIndicators])

  const filteredIndicators = useMemo(() => {
    return allIndicators.filter((ind) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        ind.sigla.toLowerCase().includes(q) ||
        ind.descricao.toLowerCase().includes(q) ||
        ind.grupo.toLowerCase().includes(q) ||
        ind.acao.toLowerCase().includes(q)
      const matchesType = filterType === 'Todos' || ind.tipo === filterType
      return matchesSearch && matchesType
    })
  }, [allIndicators, search, filterType])

  // Group by `grupo`
  const groupedIndicators = useMemo(() => {
    const groups: Record<string, IndicatorInfo[]> = {}
    filteredIndicators.forEach((ind) => {
      if (!groups[ind.grupo]) groups[ind.grupo] = []
      groups[ind.grupo].push(ind)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredIndicators])

  const toggleExpand = (sigla: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(sigla)) next.delete(sigla)
      else next.add(sigla)
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setFilterType('Todos')
  }

  const hasActiveFilters = search !== '' || filterType !== 'Todos'

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Dicionário de Indicadores"
      description="Consulte o significado e a ação recomendada para cada código do extrato CNIS."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Buscar sigla, descrição ou ação..."
            aria-label="Filtrar indicadores"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shadow-xs h-10 w-full rounded-xl border border-slate-200/80 pl-10 pr-10 font-sans text-sm transition-all placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Buttons with counts */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tipo">
          {FILTERS.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                filterType === type
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {type === 'Todos' ? 'Todos' : `${type}s`}
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums',
                  filterType === type
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {countByType[type]}
              </span>
            </button>
          ))}
        </div>

        {/* Active Filters Banner */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                Mostrando <span className="font-extrabold">{filteredIndicators.length}</span> de{' '}
                <span className="font-extrabold">{allIndicators.length}</span>
                {filterType !== 'Todos' && (
                  <>
                    {' '}
                    · Filtro: <span className="font-extrabold">{filterType}s</span>
                  </>
                )}
                {search && (
                  <>
                    {' '}
                    · Busca: <span className="font-mono font-extrabold">"{search}"</span>
                  </>
                )}
              </span>
            </div>
            <button
              onClick={clearFilters}
              className="whitespace-nowrap rounded text-[10px] font-extrabold uppercase tracking-wider text-amber-700 transition-colors hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Results */}
        {filteredIndicators.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhum indicador encontrado"
            description="Experimente mudar o termo de busca ou o filtro de tipo."
          />
        ) : (
          <div className="space-y-6">
            {groupedIndicators.map(([grupo, indicators]) => (
              <div key={grupo} className="space-y-2">
                {/* Group Header */}
                <div className="flex items-center gap-2.5 border-b border-slate-100 py-1">
                  <span className="truncate font-sans text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                    {grupo}
                  </span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums text-slate-400">
                    {indicators.length}
                  </span>
                </div>

                {/* Indicator Cards (Accordion) */}
                <div className="space-y-2">
                  {indicators.map((ind) => {
                    const Icon = TYPE_ICON[ind.tipo] ?? Info
                    const iconColor = TYPE_COLOR[ind.tipo] ?? 'text-slate-500'
                    const isExpanded = expandedKeys.has(ind.sigla)

                    return (
                      <div
                        key={ind.sigla}
                        className={cn(
                          'rounded-xl border bg-white transition-all duration-300',
                          ind.critico
                            ? 'border-red-200 hover:border-red-300'
                            : 'border-slate-200/80 hover:border-slate-300/80',
                          isExpanded && 'shadow-sm'
                        )}
                      >
                        {/* Collapsed Row (always visible) */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(ind.sigla)}
                          aria-expanded={isExpanded}
                          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
                        >
                          {/* Type Icon */}
                          <div
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                              ind.critico
                                ? 'border-red-100 bg-red-50 text-red-600'
                                : 'border-slate-150 bg-slate-50'
                            )}
                          >
                            {ind.critico ? (
                              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Icon className={cn('h-3.5 w-3.5', iconColor)} aria-hidden="true" />
                            )}
                          </div>

                          {/* Sigla + descrição truncada */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-bold text-slate-900">
                                {ind.sigla}
                              </span>
                              {ind.critico && (
                                <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-red-700">
                                  Crítico
                                </span>
                              )}
                              <Badge variant={TYPE_VARIANT[ind.tipo]}>{ind.tipo}</Badge>
                            </div>
                            <p className="mt-0.5 truncate font-sans text-xs leading-snug text-slate-500">
                              {ind.descricao}
                            </p>
                          </div>

                          {/* Chevron */}
                          <div className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-600">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-amber-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
                            <div>
                              <span className="mb-1 block font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Descrição Completa
                              </span>
                              <p className="text-sm leading-relaxed text-slate-700">
                                {ind.descricao}
                              </p>
                            </div>

                            <div>
                              <div className="mb-2 flex items-center gap-2">
                                <div
                                  className="flex h-5 w-5 items-center justify-center rounded-md border border-amber-100 bg-amber-50 text-amber-600"
                                  aria-hidden="true"
                                >
                                  <Icon className="h-3 w-3" />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                                  Ação Recomendada
                                </span>
                              </div>
                              <p className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-sm leading-relaxed text-slate-600">
                                {ind.acao}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}
