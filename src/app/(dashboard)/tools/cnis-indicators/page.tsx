'use client'

import { useState, useMemo } from 'react'
import { Search, BookOpen, AlertTriangle, CheckCircle2, Info, ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { CNIS_INDICATORS, type IndicatorInfo } from '../../../../services/cnis/indicatorsDictionary'
import { cn } from '@/lib/utils'

type Tipo = 'Todos' | 'Pendência' | 'Acerto' | 'Informativo'

const TIPO_LEGEND: Record<Exclude<Tipo, 'Todos'>, { label: string; icon: typeof AlertTriangle; color: string }> = {
  Pendência: { label: 'Requer ação do usuário para resolver', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  Acerto: { label: 'Correção aplicada automaticamente pelo sistema', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  Informativo: { label: 'Apenas para consulta, nenhuma ação necessária', icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200' },
}

const TIPO_STYLES = {
  Pendência: { tag: 'text-red-700 bg-red-50 border-red-200/60', dot: 'bg-red-500' },
  Acerto: { tag: 'text-emerald-700 bg-emerald-50 border-emerald-200/60', dot: 'bg-emerald-500' },
  Informativo: { tag: 'text-blue-700 bg-blue-50 border-blue-200/60', dot: 'bg-blue-500' },
  Outro: { tag: 'text-slate-700 bg-slate-50 border-slate-200/60', dot: 'bg-slate-400' },
}

export default function CnisIndicatorsPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<Tipo>('Todos')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const indicatorsList = useMemo(() => Object.values(CNIS_INDICATORS), [])

  const filteredIndicators = useMemo(() => {
    return indicatorsList.filter(ind => {
      const q = search.toLowerCase()
      const matchesSearch =
        ind.sigla.toLowerCase().includes(q) ||
        ind.descricao.toLowerCase().includes(q) ||
        ind.grupo.toLowerCase().includes(q)
      const matchesType = filterType === 'Todos' || ind.tipo === filterType
      return matchesSearch && matchesType
    })
  }, [indicatorsList, search, filterType])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredIndicators>()
    for (const ind of filteredIndicators) {
      const list = map.get(ind.grupo) ?? []
      list.push(ind)
      map.set(ind.grupo, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredIndicators])

  const toggle = (sigla: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(sigla)) next.delete(sigla)
      else next.add(sigla)
      return next
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Indicadores do CNIS</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">
            Consulte a biblioteca completa de siglas do INSS e as ações práticas necessárias para resolver cada pendência.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(TIPO_LEGEND) as [Exclude<Tipo, 'Todos'>, typeof TIPO_LEGEND['Pendência']][]).map(([tipo, legend]) => (
          <span key={tipo} className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold', legend.color)}>
            <legend.icon className="w-3.5 h-3.5" />
            <span className="font-extrabold uppercase tracking-wider">{tipo}</span>
            <span className="opacity-75 hidden sm:inline">&mdash;</span>
            <span className="hidden sm:inline">{legend.label}</span>
          </span>
        ))}
      </div>

      {/* Sticky Search + Chips */}
      <div className="sticky top-0 z-10 bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por sigla (ex: PEXT), grupo ou descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['Todos', 'Pendência', 'Acerto', 'Informativo'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'text-xs font-bold px-3.5 py-2 rounded-lg border transition-all duration-200',
                  filterType === type
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                )}
              >
                {type === 'Todos' ? 'Todos os Indicadores' : `${type}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped Accordion List */}
      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map(([grupo, items]) => (
            <section key={grupo}>
              <h2 className="font-sans font-extrabold text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3 px-1">
                {grupo}
                <span className="ml-2 font-mono text-slate-300">({items.length})</span>
              </h2>
              <div className="space-y-1.5">
                {items.map((ind: IndicatorInfo) => {
                  const isOpen = expanded.has(ind.sigla)
                  const styles = TIPO_STYLES[ind.tipo] ?? TIPO_STYLES.Outro

                  return (
                    <div
                      key={ind.sigla}
                      className={cn(
                        'bg-white border rounded-xl transition-all duration-200',
                        isOpen
                          ? 'border-slate-200 shadow-md'
                          : 'border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-200'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(ind.sigla)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                        aria-expanded={isOpen}
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                        />
                        <span className="font-mono font-extrabold text-[11px] text-slate-900 tracking-wide bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded shrink-0">
                          {ind.sigla}
                        </span>
                        <span className={cn('text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0', styles.tag)}>
                          {ind.tipo}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/40 px-2 py-0.5 rounded-md truncate min-w-0">
                          {ind.grupo}
                        </span>
                      </button>

                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-200 ease-in-out',
                          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                          {ind.critico && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 text-[9px] font-extrabold uppercase tracking-wide">
                              <AlertTriangle className="w-3 h-3" />
                              Crítico
                            </span>
                          )}

                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider block mb-1">
                              Descrição
                            </span>
                            <p className="text-sm text-slate-700 font-sans leading-relaxed font-medium">
                              {ind.descricao}
                            </p>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block mb-1.5 flex items-center gap-1">
                              {ind.tipo === 'Pendência' ? (
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              ) : ind.tipo === 'Acerto' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Info className="w-3 h-3 text-blue-600" />
                              )}
                              Ação Recomendada
                            </span>
                            <p
                              className={cn(
                                'text-xs p-3 rounded-lg leading-relaxed font-semibold border',
                                ind.tipo === 'Pendência' && 'bg-amber-50/25 border-amber-100/50 text-slate-700',
                                ind.tipo === 'Acerto' && 'bg-emerald-50/20 border-emerald-100/60 text-slate-700',
                                ind.tipo === 'Informativo' && 'bg-blue-50/20 border-blue-100/60 text-slate-700',
                                (!ind.tipo || ind.tipo === 'Outro') && 'bg-slate-50 border-slate-100 text-slate-700'
                              )}
                            >
                              {ind.acao}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-slate-800 text-base">Nenhum indicador encontrado</h3>
          <p className="font-sans text-slate-500 text-sm mt-1">Experimente buscar por outras siglas ou palavras-chave.</p>
        </div>
      )}
    </div>
  )
}
