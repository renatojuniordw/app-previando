'use client'

import { useState, useMemo } from 'react'
import { Search, BookOpen, AlertTriangle, CheckCircle2, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CNIS_INDICATORS } from '../../../../services/cnis/indicatorsDictionary'
import { cn } from '@/lib/utils'

export default function CnisIndicatorsPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'Todos' | 'Pendência' | 'Acerto' | 'Informativo'>('Todos')

  const indicatorsList = useMemo(() => {
    return Object.values(CNIS_INDICATORS)
  }, [])

  const filteredIndicators = useMemo(() => {
    return indicatorsList.filter(ind => {
      const matchesSearch = 
        ind.sigla.toLowerCase().includes(search.toLowerCase()) ||
        ind.descricao.toLowerCase().includes(search.toLowerCase()) ||
        ind.grupo.toLowerCase().includes(search.toLowerCase())

      const matchesType = filterType === 'Todos' || ind.tipo === filterType
      return matchesSearch && matchesType
    })
  }, [indicatorsList, search, filterType])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
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

      {/* Control Area (Search & Filters) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por sigla (ex: PEXT), grupo ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
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
              {type === 'Todos' ? 'Todos os Indicadores' : type + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIndicators.length > 0 ? (
          filteredIndicators.map(ind => {
            const isCritical = ind.critico

            // Dynamic Styling based on Tipo
            const stylesMap = {
              Pendência: {
                tag: 'text-red-700 bg-red-50 border-red-200/60',
                actionBg: 'bg-amber-50/25 border-amber-100/50 text-slate-700',
                actionIcon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              },
              Acerto: {
                tag: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
                actionBg: 'bg-emerald-50/20 border-emerald-100/60 text-slate-700',
                actionIcon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              },
              Informativo: {
                tag: 'text-blue-700 bg-blue-50 border-blue-200/60',
                actionBg: 'bg-blue-50/20 border-blue-100/60 text-slate-700',
                actionIcon: <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              },
              Outro: {
                tag: 'text-slate-700 bg-slate-50 border-slate-200/60',
                actionBg: 'bg-slate-50 border-slate-100 text-slate-650',
                actionIcon: <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              }
            }

            const styles = stylesMap[ind.tipo] || stylesMap.Outro

            return (
              <div 
                key={ind.sigla} 
                className={cn(
                  'bg-white border rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5',
                  isCritical 
                    ? 'border-red-200 bg-red-50/[0.04]' 
                    : 'border-slate-200/80'
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono font-extrabold text-sm text-slate-900 tracking-wide bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                      {ind.sigla}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isCritical && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 text-[8px] font-extrabold uppercase tracking-wide">
                          Crítico
                        </span>
                      )}
                      <span className={cn('text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border', styles.tag)}>
                        {ind.tipo}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider block">Grupo</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/40 px-2.5 py-0.5 rounded-md inline-block">
                      {ind.grupo}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider block">Descrição</span>
                    <p className="text-sm text-slate-700 font-sans leading-relaxed font-medium">{ind.descricao}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest flex items-center gap-1.5 mb-2">
                    {styles.actionIcon}
                    Ação Recomendada
                  </span>
                  <p className={cn('text-xs p-3.5 rounded-lg leading-relaxed font-semibold border', styles.actionBg)}>
                    {ind.acao}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-slate-800 text-base">Nenhum indicador encontrado</h3>
            <p className="font-sans text-slate-500 text-sm mt-1">Experimente buscar por outras siglas ou palavras-chave.</p>
          </div>
        )}
      </div>
    </div>
  )
}
