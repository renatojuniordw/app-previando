'use client'

import { useState, useMemo } from 'react'
import { Search, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { CNIS_INDICATORS } from '../../../../../../services/cnis/indicatorsDictionary'

interface Props {
  open: boolean
  onClose: () => void
}

const FILTERS = ['Todos', 'Pendência', 'Acerto', 'Informativo'] as const

export function CnisIndicatorsDrawer({ open, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'Todos' | 'Pendência' | 'Acerto' | 'Informativo'>('Todos')

  const filteredIndicators = useMemo(() => {
    return Object.values(CNIS_INDICATORS).filter(ind => {
      const matchesSearch =
        ind.sigla.toLowerCase().includes(search.toLowerCase()) ||
        ind.descricao.toLowerCase().includes(search.toLowerCase()) ||
        ind.grupo.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType === 'Todos' || ind.tipo === filterType
      return matchesSearch && matchesType
    })
  }, [search, filterType])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Dicionário de Indicadores"
      description="Consulte o significado de cada indicador presente no extrato CNIS."
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar sigla ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-all ${
                filterType === type
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {type === 'Todos' ? 'Todos' : type + 's'}
            </button>
          ))}
        </div>

        {filteredIndicators.length > 0 ? (
          <div className="space-y-3">
            {filteredIndicators.map(ind => {
              const Icon = ind.tipo === 'Pendência' ? AlertTriangle : ind.tipo === 'Acerto' ? CheckCircle2 : Info
              const typeStyles = ind.tipo === 'Pendência'
                ? 'text-red-600 bg-red-50 border-red-200'
                : ind.tipo === 'Acerto'
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : 'text-blue-600 bg-blue-50 border-blue-200'

              return (
                <div
                  key={ind.sigla}
                  className={`bg-white border rounded-lg p-4 transition-all hover:shadow-sm ${
                    ind.critico ? 'border-red-300' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                      {ind.sigla}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeStyles}`}>
                      {ind.tipo}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">Descrição</span>
                      <p className="text-slate-700 leading-relaxed mt-0.5">{ind.descricao}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-700">
                        <Icon className="w-3 h-3" />
                        Ação Recomendada
                      </span>
                      <p className="text-slate-600 leading-relaxed mt-1 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                        {ind.acao}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="font-serif font-bold text-sm text-slate-900 mb-1">Nenhum indicador encontrado</p>
            <p className="font-sans text-xs text-slate-500">Experimente mudar o termo de busca ou o filtro.</p>
          </div>
        )}
      </div>
    </Drawer>
  )
}
