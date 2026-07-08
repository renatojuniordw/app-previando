'use client'

import { useState, useRef } from 'react'
import { Briefcase, Edit3, FileSpreadsheet, MoreHorizontal, Plus, Search, User, FileText, Calendar, CheckCircle2, Trash2 } from 'lucide-react'
import { CnisExtractedData as ExtractedData } from '@/types/cnis'
import { formatDateString, getPeriodWarnings } from '../_utils'
import { PeriodItem } from './PeriodItem'
import { EditFieldModal } from './modals/EditFieldModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, cn } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/cnis-status'

interface Props {
  data: ExtractedData
  cnisCreatedAt: string
  cnisUpdatedAt: string
  cnisStatus: string
  onReprocessClick: () => void
  onUploadClick: () => void
  onDeleteCnisClick: () => void
  onEditField: (field: keyof ExtractedData, value: string) => void
  onExportCSV: () => void
  onAddPeriod: () => void
  onEditPeriod: (idx: number) => void
  onEditSalaries: (idx: number) => void
  onDeletePeriod: (idx: number) => void
}

export function CnisExtractedDataView({
  data, cnisCreatedAt, cnisUpdatedAt, cnisStatus,
  onReprocessClick, onUploadClick, onDeleteCnisClick,
  onEditField, onExportCSV, onAddPeriod, onEditPeriod, onEditSalaries, onDeletePeriod,
}: Props) {
  const [showMobileToolbar, setShowMobileToolbar] = useState(false)
  const mobileToolbarRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPeriods, setExpandedPeriods] = useState<Record<number, boolean>>({})
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)
  const [editFieldState, setEditFieldState] = useState<{
    label: string
    currentValue: string
    onSave: (v: string) => void
  } | null>(null)

  const togglePeriod = (idx: number) => setExpandedPeriods(prev => ({ ...prev, [idx]: !prev[idx] }))
  const expandAll = () => {
    const next: Record<number, boolean> = {}
    data.periodos?.forEach((_, i) => { next[i] = true })
    setExpandedPeriods(next)
  }
  const collapseAll = () => setExpandedPeriods({})

  const openEditField = (label: string, currentValue: string, onSave: (v: string) => void) => {
    setEditFieldState({ label, currentValue, onSave })
  }

  const filteredPeriodos = data.periodos?.filter(p => {
    const q = searchQuery.toLowerCase()
    return (p.empregador || '').toLowerCase().includes(q) || (p.inicio || '').includes(q) || (p.fim || '').includes(q)
  }) || []

  const statusConfig = STATUS_CONFIG[cnisStatus] || { label: cnisStatus, color: 'slate' as const }

  // Sidebar segment showing client data
  const seguradoCard = (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
          <User className="w-4.5 h-4.5" aria-hidden="true" />
        </div>
        <h2 className="font-serif font-bold text-base text-slate-850">
          Dados do Segurado
        </h2>
      </div>

      <div className="space-y-4">
        <EditableField label="Nome Completo" value={data.nome ?? 'Não identificado'} currentValue={data.nome || ''} onSave={v => onEditField('nome', v)} onOpenEdit={openEditField} />
        <EditableField label="NIT / PIS" value={data.nit ?? 'Não identificado'} currentValue={data.nit || ''} onSave={v => onEditField('nit', v)} onOpenEdit={openEditField} />
        <EditableField label="Data de Nascimento" value={formatDateString(data.dataNascimento ?? '')} currentValue={data.dataNascimento || ''} onSave={v => onEditField('dataNascimento', v)} onOpenEdit={openEditField} />

        <CalculatedField label="Total de Competências" value={`${data.totalContribuicoes ?? 0} contribuições`} />
        <CalculatedField label="Primeira Contribuição" value={formatDateString(data.primeiraContribuicao ?? '')} isMono />
        <CalculatedField label="Última Contribuição" value={formatDateString(data.ultimaContribuicao ?? '')} isMono />
      </div>
    </div>
  )

  // Document metadata card
  const documentoCard = (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
            <FileText className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <h2 className="font-serif font-bold text-base text-slate-850">
            Documento CNIS
          </h2>
        </div>
        <Badge variant={statusConfig.color} className="uppercase text-[8px] font-extrabold tracking-wider px-2 py-0.5">{statusConfig.label}</Badge>
      </div>

      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-455 font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Enviado em:</span>
          <span className="font-mono font-bold text-slate-700">{formatDate(cnisCreatedAt)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-455 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Atualizado:</span>
          <span className="font-mono font-bold text-slate-700">{formatDate(cnisUpdatedAt)}</span>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onReprocessClick} className="flex-1">
              Reprocessar
            </Button>
            <Button variant="dark" size="sm" onClick={onUploadClick} className="flex-1">
              Novo Upload
            </Button>
          </div>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={onDeleteCnisClick} 
            className="w-full flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-white" aria-hidden="true" />
            Excluir Extrato CNIS
          </Button>
        </div>
      </div>
    </div>
  )

  // Main Period List Card
  const listCard = (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
            <Briefcase className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <h2 className="font-serif font-bold text-base text-slate-850">
            Histórico de Vínculos
          </h2>
          <span className="font-sans text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md whitespace-nowrap">
            {data.periodos?.length ?? 0} {data.periodos?.length === 1 ? 'vínculo' : 'vínculos'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExportCSV} className="flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-550" />
              <span>Exportar CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expandir
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Recolher
            </Button>
          </div>
          <div className="sm:hidden" ref={mobileToolbarRef}>
            <button
              onClick={() => setShowMobileToolbar(v => !v)}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              aria-label="Mais ações"
              aria-expanded={showMobileToolbar}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMobileToolbar && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMobileToolbar(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                  <button onClick={() => { onExportCSV(); setShowMobileToolbar(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-slate-550" />
                    Exportar CSV
                  </button>
                  <button onClick={() => { expandAll(); setShowMobileToolbar(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors">
                    Expandir todos
                  </button>
                  <button onClick={() => { collapseAll(); setShowMobileToolbar(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 text-left transition-colors">
                    Recolher todos
                  </button>
                </div>
              </>
            )}
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onAddPeriod} 
            className="bg-amber-600 border-amber-600 hover:bg-amber-700 hover:border-amber-700 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por empresa, data de início ou fim..."
          aria-label="Filtrar vínculos do histórico"
          className="w-full pl-10 pr-4 h-10 border border-slate-200/80 rounded-xl text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus-visible:ring-2 transition-all placeholder:text-slate-400 shadow-xs"
        />
      </div>

      {filteredPeriodos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="font-sans text-slate-500 text-sm font-medium">Nenhum vínculo corresponde aos filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-4">
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
              onDelete={() => setConfirmDeleteIdx(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    // Always render 2-column split dashboard on desktop since PDF is displayed on the drawer overlay
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* Main Area */}
      <div className="xl:col-span-2 space-y-6">
        {listCard}
      </div>

      {/* Sidebar Area */}
      <div className="xl:col-span-1 space-y-6">
        {seguradoCard}
        {documentoCard}
      </div>

      <ConfirmDialog
        open={confirmDeleteIdx !== null}
        onConfirm={() => {
          if (confirmDeleteIdx !== null) onDeletePeriod(confirmDeleteIdx)
          setConfirmDeleteIdx(null)
        }}
        onCancel={() => setConfirmDeleteIdx(null)}
        title="Excluir Vínculo"
        message={confirmDeleteIdx !== null && data.periodos ? `Excluir o vínculo da empresa "${data.periodos[confirmDeleteIdx]?.empregador || 'Não informado'}"?` : ''}
        confirmLabel="Excluir"
        variant="danger"
      />

      <EditFieldModal
        open={!!editFieldState}
        label={editFieldState?.label ?? ''}
        currentValue={editFieldState?.currentValue ?? ''}
        onClose={() => setEditFieldState(null)}
        onSave={(v) => {
          editFieldState?.onSave(v)
          setEditFieldState(null)
        }}
      />
    </div>
  )
}

function EditableField({ label, value, currentValue, onSave, onOpenEdit }: {
  label: string; value: string; currentValue: string; onSave: (v: string) => void; onOpenEdit: (label: string, currentValue: string, onSave: (v: string) => void) => void
}) {
  return (
    <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 relative group hover:border-slate-350 transition-all duration-300">
      <span className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans font-bold text-slate-800 text-sm truncate">{value}</span>
        <button
          onClick={() => onOpenEdit(label, currentValue, onSave)}
          className="opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:text-amber-600 transition-opacity p-1 text-slate-455 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
          title={`Editar ${label.toLowerCase()}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function CalculatedField({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4">
      <span className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">{label}</span>
      <span className={cn(
        "font-sans font-bold text-slate-800 text-sm block",
        isMono && "font-mono"
      )}>
        {value}
      </span>
    </div>
  )
}
