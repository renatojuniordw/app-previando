import { useState } from 'react'
import { Briefcase, Download, Edit3, Plus, Search, User } from 'lucide-react'
import { CnisExtractedData as ExtractedData } from '../_types'
import { formatDateString, getPeriodWarnings } from '../_utils'
import { PeriodItem } from './PeriodItem'

interface Props {
  data: ExtractedData
  onEditField: (field: keyof ExtractedData, value: string) => void
  onExportCSV: () => void
  onAddPeriod: () => void
  onEditPeriod: (idx: number) => void
  onEditSalaries: (idx: number) => void
  onDeletePeriod: (idx: number) => void
}

export function CnisExtractedDataView({
  data, onEditField, onExportCSV, onAddPeriod, onEditPeriod, onEditSalaries, onDeletePeriod,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPeriods, setExpandedPeriods] = useState<Record<number, boolean>>({})

  const togglePeriod = (idx: number) => setExpandedPeriods(prev => ({ ...prev, [idx]: !prev[idx] }))
  const expandAll = () => {
    const next: Record<number, boolean> = {}
    data.periodos?.forEach((_, i) => { next[i] = true })
    setExpandedPeriods(next)
  }
  const collapseAll = () => setExpandedPeriods({})

  const filteredPeriodos = data.periodos?.filter(p => {
    const q = searchQuery.toLowerCase()
    return (p.empregador || '').toLowerCase().includes(q) || (p.inicio || '').includes(q) || (p.fim || '').includes(q)
  }) || []

  return (
    <div className="space-y-8 mt-6">
      {/* Dados do Segurado */}
      <div className="border-t border-slate-150 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h4 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-600" aria-hidden="true" />
            Dados do Segurado
          </h4>
          <button
            onClick={onExportCSV}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar para CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <EditableField label="Nome Completo" value={data.nome ?? 'Não identificado'} prompt="Editar Nome Completo:" currentValue={data.nome || ''} onSave={v => onEditField('nome', v)} />
          <EditableField label="NIT / PIS" value={data.nit ?? 'Não identificado'} prompt="Editar NIT/PIS:" currentValue={data.nit || ''} onSave={v => onEditField('nit', v)} />
          <EditableField label="Data de Nascimento" value={formatDateString(data.dataNascimento ?? '')} prompt="Editar Data Nascimento (formato AAAA-MM-DD):" currentValue={data.dataNascimento || ''} onSave={v => onEditField('dataNascimento', v)} />

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Total de Contribuições</span>
            <span className="font-sans font-bold text-slate-800 text-sm">{data.totalContribuicoes ?? 0} competências</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Primeira Contribuição</span>
            <span className="font-sans font-bold text-slate-800 text-sm">{formatDateString(data.primeiraContribuicao ?? '')}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Última Contribuição</span>
            <span className="font-sans font-bold text-slate-800 text-sm">{formatDateString(data.ultimaContribuicao ?? '')}</span>
          </div>
        </div>
      </div>

      {/* Histórico de Vínculos */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-600" aria-hidden="true" />
              Histórico de Vínculos Empregatícios
            </h4>
            <span className="font-sans text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
              {data.periodos?.length ?? 0} {data.periodos?.length === 1 ? 'vínculo' : 'vínculos'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={expandAll} className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none">
              Expandir Todos
            </button>
            <button onClick={collapseAll} className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none">
              Recolher Todos
            </button>
            <button onClick={onAddPeriod} className="bg-amber-600 hover:bg-amber-700 text-white font-sans font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none">
              <Plus className="w-3.5 h-3.5" />
              Adicionar Vínculo
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar vínculo por empresa, data de início ou data fim…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus-visible:ring-2 transition-all placeholder:text-slate-400"
          />
        </div>

        {filteredPeriodos.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-150 rounded-xl">
            <p className="font-sans text-slate-500 text-sm">Nenhum vínculo corresponde aos filtros aplicados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPeriodos.map((periodo, idx) => (
              <PeriodItem
                key={idx}
                periodo={periodo}
                idx={idx}
                isExpanded={!!expandedPeriods[idx]}
                warnings={getPeriodWarnings(periodo, idx, data.periodos || [])}
                onToggle={() => togglePeriod(idx)}
                onEdit={() => onEditPeriod(idx)}
                onEditSalaries={() => onEditSalaries(idx)}
                onDelete={() => {
                  if (confirm(`Excluir o vínculo da empresa "${periodo.empregador || 'Não informado'}"?`)) {
                    onDeletePeriod(idx)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditableField({ label, value, prompt, currentValue, onSave }: {
  label: string; value: string; prompt: string; currentValue: string; onSave: (v: string) => void
}) {
  return (
    <div className="bg-amber-50/20 border border-amber-100/30 rounded-xl p-4 relative group">
      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans font-bold text-slate-800 text-sm truncate">{value}</span>
        <button
          onClick={() => {
            const result = window.prompt(prompt, currentValue)
            if (result !== null) onSave(result)
          }}
          className="opacity-0 group-hover:opacity-100 hover:text-amber-600 transition-opacity p-0.5"
          title={`Editar ${label.toLowerCase()}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
