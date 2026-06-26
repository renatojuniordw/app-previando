'use client'

import { useState, useMemo } from 'react'
import { X, Search, Info, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react'
import { CNIS_INDICATORS } from '../../../../../../services/cnis/indicatorsDictionary'

interface Props {
  open: boolean
  onClose: () => void
}

export function CnisIndicatorsDrawer({ open, onClose }: Props) {
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

  if (!open) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 text-slate-100 border-l border-slate-800 shadow-2xl z-50 flex flex-col focus-visible:outline-none animate-slide-in">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes slide-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in {
            animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
          }
        ` }} />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-bold text-base text-slate-100">Dicionário de Indicadores</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-850 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar sigla ou descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="flex gap-1.5">
            {(['Todos', 'Pendência', 'Acerto', 'Informativo'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-md border transition-all ${
                  filterType === type
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'Todos' ? 'Todos' : type + 's'}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="grow overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
          {filteredIndicators.length > 0 ? (
            filteredIndicators.map(ind => {
              const Icon = ind.tipo === 'Pendência' ? AlertTriangle : ind.tipo === 'Acerto' ? CheckCircle2 : Info
              const typeColor = ind.tipo === 'Pendência' ? 'text-red-400 bg-red-500/10 border-red-500/20' : ind.tipo === 'Acerto' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'

              return (
                <div 
                  key={ind.sigla} 
                  className={`bg-slate-950 border rounded-xl p-4 transition-all duration-200 hover:border-slate-700 ${
                    ind.critico ? 'border-red-500/30' : 'border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-sans font-black text-sm text-slate-100 tracking-wider bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                      {ind.sigla}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${typeColor}`}>
                      {ind.tipo}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Descrição</span>
                      <p className="text-slate-300 font-sans leading-relaxed mt-0.5">{ind.descricao}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-900">
                      <span className="text-[10px] text-amber-500 uppercase font-black block tracking-wider flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        Ação Recomendada (O que fazer)
                      </span>
                      <p className="text-slate-300 font-sans leading-relaxed mt-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                        {ind.acao}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Search className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-sm font-medium">Nenhum indicador encontrado.</p>
              <p className="text-xs text-slate-650 mt-1">Experimente mudar o termo de busca ou o filtro.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
