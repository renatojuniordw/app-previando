'use client'

import { useState, useMemo } from 'react'
import { Search, BookOpen, AlertTriangle, CheckCircle2, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CNIS_INDICATORS } from '../../../../services/cnis/indicatorsDictionary'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-semibold mb-2">
            <Link href="/dashboard" className="flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="font-serif font-bold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            Dicionário de Indicadores do CNIS
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Consulte a biblioteca completa de siglas do INSS e as ações práticas necessárias para resolver cada pendência.
          </p>
        </div>
      </div>

      {/* Control Area (Search & Filters) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por sigla (ex: PEXT), grupo ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['Todos', 'Pendência', 'Acerto', 'Informativo'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs font-bold px-3.5 py-2 rounded-lg border transition-all ${
                filterType === type
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {type === 'Todos' ? 'Todos os Indicadores' : type + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIndicators.length > 0 ? (
          filteredIndicators.map(ind => {
            const Icon = ind.tipo === 'Pendência' ? AlertTriangle : ind.tipo === 'Acerto' ? CheckCircle2 : Info
            const typeClass = ind.tipo === 'Pendência' 
              ? 'text-red-700 bg-red-50 border-red-100' 
              : ind.tipo === 'Acerto' 
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                : 'text-blue-700 bg-blue-50 border-blue-100'

            return (
              <div 
                key={ind.sigla} 
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 ${
                  ind.critico ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-sans font-black text-base text-slate-800 tracking-wider bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                      {ind.sigla}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${typeClass}`}>
                      {ind.tipo}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Grupo</span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {ind.grupo}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Descrição</span>
                    <p className="text-sm text-slate-700 font-sans leading-relaxed">{ind.descricao}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    Ação Recomendada:
                  </span>
                  <p className="text-xs text-slate-650 bg-amber-50/30 border border-amber-100/50 p-3 rounded-lg leading-relaxed font-medium">
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
