'use client'

import { useEffect, useState, useCallback, useRef, memo } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { ClientSwitcher } from '@/components/ClientSwitcher'
import { useToast } from '@/store/toast'
import { Clock, FileText, LayoutTemplate, AlertTriangle } from 'lucide-react'
import { BENEFIT_SHORT_LABELS, PRIORITY_STYLES } from '@/lib/constants'

interface KanbanCase {
  id: string
  status: string
  benefitType: string
  priority: string
  createdAt: string
  client: {
    id: string
    name: string
  }
}

const COLUMNS: { id: string; label: string }[] = [
  { id: 'PROSPECCAO', label: 'Prospecção' },
  { id: 'ANALISE', label: 'Análise' },
  { id: 'PRONTO_PARA_REQUERER', label: 'Pronto p/ Requerer' },
  { id: 'EM_PROCESSAMENTO', label: 'Em Processamento' },
  { id: 'FINALIZADO', label: 'Finalizado' },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

const CaseCard = memo(function CaseCard({ caso, isDragging }: { caso: KanbanCase; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: caso.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const badgeConfig = PRIORITY_STYLES[caso.priority] || PRIORITY_STYLES.NORMAL

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-manipulation">
      <Link href={`/cases/${caso.id}`} onClick={(e) => e.stopPropagation()} className="block outline-none">
        <div className={`bg-white border border-slate-200 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-amber-300 hover:shadow-md transition-all group ${isDragging ? 'shadow-lg ring-2 ring-amber-500 border-transparent' : 'shadow-sm'}`}>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-serif font-bold text-slate-900 text-[15px] leading-tight group-hover:text-amber-700 transition-colors">
              {BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
            </h4>
            <div className="shrink-0 ml-2">
              <Badge variant={badgeConfig.color}>{badgeConfig.label}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-sans font-semibold text-[10px] shrink-0 border border-slate-200">
              {getInitials(caso.client.name)}
            </div>
            <p className="font-sans text-sm text-slate-600 truncate font-medium">{caso.client.name}</p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5 text-slate-400">
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-sans text-xs font-medium">Docs</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-sans text-[10px] uppercase font-semibold tracking-wider">
                {new Date(caso.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
})

function DragOverlayCard({ caso }: { caso: KanbanCase }) {
  const badgeConfig = PRIORITY_STYLES[caso.priority] || PRIORITY_STYLES.NORMAL

  return (
    <div className="bg-white border-2 border-amber-500 rounded-xl p-4 shadow-xl rotate-3 opacity-95 w-full cursor-grabbing">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-serif font-bold text-slate-900 text-[15px] leading-tight">
          {BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
        </h4>
        <div className="shrink-0 ml-2">
          <Badge variant={badgeConfig.color}>{badgeConfig.label}</Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-sans font-semibold text-[10px] shrink-0 border border-slate-200">
          {getInitials(caso.client.name)}
        </div>
        <p className="font-sans text-sm text-slate-600 truncate font-medium">{caso.client.name}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-slate-400">
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default function ClientsKanbanPage() {
  const [casesByStatus, setCasesByStatus] = useState<Record<string, KanbanCase[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeDragCase, setActiveDragCase] = useState<KanbanCase | null>(null)
  const [totalActive, setTotalActive] = useState(0)
  const [confirmFinalize, setConfirmFinalize] = useState<KanbanCase | null>(null)
  const { addToast } = useToast()

  const casesRef = useRef(casesByStatus)
  casesRef.current = casesByStatus

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const load = useCallback(() => {
    setLoading(true)
    api.get('/cases', { params: { limit: 200 } })
      .then((r) => {
        const cases: KanbanCase[] = r.data.cases ?? []
        const active = cases.filter((c) => c.status !== 'FINALIZADO')
        setTotalActive(active.length)
        const grouped: Record<string, KanbanCase[]> = {}
        for (const col of COLUMNS) grouped[col.id] = []
        for (const c of cases) {
          if (grouped[c.status]) grouped[c.status].push(c)
        }
        setCasesByStatus(grouped)
      })
      .catch(() => addToast({ type: 'error', title: 'Erro ao carregar quadro' }))
      .finally(() => setLoading(false))
  }, [addToast])

  useEffect(() => { load() }, [load])

  const findCaseById = useCallback((id: string): KanbanCase | undefined => {
    for (const cases of Object.values(casesRef.current)) {
      const found = cases.find((c) => c.id === id)
      if (found) return found
    }
  }, [])

  const findColumnForCase = useCallback((id: string): string | undefined => {
    for (const [col, cases] of Object.entries(casesRef.current)) {
      if (cases.find((c) => c.id === id)) return col
    }
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const found = findCaseById(event.active.id as string)
    if (found) setActiveDragCase(found)
  }, [findCaseById])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const fromCol = findColumnForCase(activeId)
    const toCol = COLUMNS.find((c) => c.id === overId)?.id ?? findColumnForCase(overId)

    if (!fromCol || !toCol || fromCol === toCol) return

    setCasesByStatus((prev) => {
      const fromCases = prev[fromCol].filter((c) => c.id !== activeId)
      const movedCase = prev[fromCol].find((c) => c.id === activeId)!
      const toCases = [...prev[toCol], { ...movedCase, status: toCol }]
      return { ...prev, [fromCol]: fromCases, [toCol]: toCases }
    })
  }, [findColumnForCase])

  const persistMove = useCallback(async (activeId: string, newCol: string) => {
    try {
      await api.patch(`/cases/${activeId}/status`, { status: newCol })
      addToast({ type: 'success', title: 'Status atualizado' })
    } catch {
      setCasesByStatus((prev) => {
        const current = { ...prev }
        const card = Object.values(current).flat().find((c) => c.id === activeId)
        if (!card) return prev
        const oldCol = Object.entries(current).find(([, cases]) =>
          cases.find((c) => c.id === activeId)
        )?.[0]
        if (!oldCol) return prev
        current[oldCol] = [...current[oldCol], card]
        current[newCol] = current[newCol].filter((c) => c.id !== activeId)
        return current
      })
      addToast({ type: 'error', title: 'Erro ao atualizar', message: 'Tente novamente.' })
    }
  }, [addToast])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragCase(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const newCol = COLUMNS.find((c) => c.id === overId)?.id ?? findColumnForCase(overId)

    if (!newCol) return

    if (newCol === 'FINALIZADO') {
      const card = findCaseById(activeId)
      if (card) {
        setConfirmFinalize(card)
        return
      }
    }

    persistMove(activeId, newCol)
  }, [findColumnForCase, findCaseById, persistMove])

  const confirmFinalization = useCallback(() => {
    if (!confirmFinalize) return
    const card = confirmFinalize
    setConfirmFinalize(null)
    persistMove(card.id, 'FINALIZADO')
  }, [confirmFinalize, persistMove])

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        <ClientSwitcher />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" role="status" aria-label="Carregando" />
            <p className="font-sans font-medium text-slate-500 animate-pulse">Carregando quadro...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight flex items-center gap-3">
            Quadro de Casos
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1 font-medium">{totalActive} casos em andamento</p>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <ClientSwitcher />
        </div>
      </div>

      {/* Confirmation dialog for finalization */}
      {confirmFinalize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="finalize-title">
          <div className="bg-white rounded-lg shadow-elevation-md max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 id="finalize-title" className="font-serif font-bold text-lg text-slate-900">Finalizar caso?</h2>
                <p className="font-sans text-sm text-slate-600 mt-1 leading-relaxed">
                  {BENEFIT_SHORT_LABELS[confirmFinalize.benefitType] ?? confirmFinalize.benefitType} — {confirmFinalize.client.name}
                </p>
                <p className="font-sans text-xs text-slate-500 mt-2">Esta ação não pode ser desfeita. O monitoramento TrackJud será cancelado.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmFinalize(null)} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 font-sans font-medium text-sm rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
                Cancelar
              </button>
              <button onClick={confirmFinalization} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 font-sans font-medium text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                Sim, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) => `Iniciou arrasto do card ${active.id}`,
              onDragOver: ({ active, over }) => over ? `Card ${active.id} movido sobre ${over.id}` : 'Card não está mais sobre uma coluna',
              onDragEnd: ({ active, over }) => over ? `Card ${active.id} solto em ${over.id}` : 'Card solto fora da área',
              onDragCancel: ({ active }) => `Arrasto do card ${active.id} cancelado`,
            },
            screenReaderInstructions: {
              draggable: 'Para arrastar um card, pressione Espaço. Use as setas para mover entre colunas. Pressione Espaço novamente para soltar.',
            },
          }}
        >
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map((col) => {
              const cases = casesByStatus[col.id] ?? []
              return (
                <div key={col.id} className="w-[320px] flex flex-col h-full bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden shrink-0">
                  {/* Column Header */}
                  <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-100 flex items-center justify-between shrink-0">
                    <span className="font-sans font-bold text-[15px] text-slate-800 tracking-wide">
                      {col.label}
                    </span>
                    <span className="w-6 h-6 flex items-center justify-center font-sans text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm">
                      {cases.length}
                    </span>
                  </div>

                  {/* Column Body */}
                  <div className="flex-1 overflow-y-auto p-4 neo-scroll" role="list" aria-label={`Coluna ${col.label}`}>
                    <SortableContext
                      id={col.id}
                      items={cases.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div data-column-id={col.id} className="min-h-full space-y-4">
                        {cases.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                            <LayoutTemplate className="w-8 h-8 text-slate-400 mb-2" aria-hidden="true" />
                            <span className="font-sans font-medium text-sm text-slate-500">Arraste casos para cá</span>
                          </div>
                        ) : (
                          cases.map((caso) => (
                            <CaseCard
                              key={caso.id}
                              caso={caso}
                              isDragging={activeDragCase?.id === caso.id}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {activeDragCase && (
              <div className="w-[288px]">
                <DragOverlayCard caso={activeDragCase} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
