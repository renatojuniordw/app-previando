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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Clock, FileText, LayoutTemplate, Layers } from 'lucide-react'
import { BENEFIT_SHORT_LABELS, PRIORITY_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'

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
        <div className={cn(
          'bg-white border rounded-xl p-5 cursor-grab active:cursor-grabbing hover:border-slate-350 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group shadow-sm',
          isDragging ? 'shadow-lg ring-1 ring-amber-500/50 border-transparent' : 'border-slate-200/85'
        )}>
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-serif font-bold text-slate-800 text-sm leading-snug group-hover:text-amber-700 transition-colors">
              {BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
            </h4>
            <div className="shrink-0 ml-2">
              <Badge variant={badgeConfig.color}>{badgeConfig.label}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 font-serif font-bold text-[10px] shrink-0 border border-slate-250 shadow-xs group-hover:bg-slate-100 transition-colors">
              {getInitials(caso.client.name)}
            </div>
            <p className="font-sans text-xs text-slate-650 truncate font-bold">{caso.client.name}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-105">
            <div className="flex items-center gap-1.5 text-slate-400">
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">Documentos</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[9px] uppercase font-bold tracking-wider">
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
    <div className="bg-white border border-amber-500 rounded-xl p-5 shadow-xl rotate-2 opacity-95 w-full cursor-grabbing">
      <div className="flex items-start justify-between mb-4">
        <h4 className="font-serif font-bold text-slate-900 text-sm leading-snug">
          {BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
        </h4>
        <div className="shrink-0 ml-2">
          <Badge variant={badgeConfig.color}>{badgeConfig.label}</Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 font-serif font-bold text-[10px] shrink-0 border border-slate-200 shadow-sm">
          {getInitials(caso.client.name)}
        </div>
        <p className="font-sans text-xs text-slate-655 truncate font-semibold">{caso.client.name}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-400">
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">Documentos</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase font-bold tracking-wider">
            {new Date(caso.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
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
    api.get('/cases', { params: { limit: 100 } })
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <ClientSwitcher />
        </div>
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
    <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)] flex flex-col space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Quadro de Casos</h1>
            <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">{totalActive} casos em andamento</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <ClientSwitcher />
        </div>
      </div>

      <ConfirmDialog
        open={confirmFinalize !== null}
        variant="danger"
        title="Finalizar caso?"
        message={`${BENEFIT_SHORT_LABELS[confirmFinalize?.benefitType ?? ''] ?? confirmFinalize?.benefitType ?? ''} — ${confirmFinalize?.client.name ?? ''}\n\nEsta ação não pode ser desfeita.`}
        confirmLabel="Finalizar"
        onConfirm={confirmFinalization}
        onCancel={() => setConfirmFinalize(null)}
      />

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
              const MAX_VISIBLE = 30
              const visibleCases = cases.slice(0, MAX_VISIBLE)
              const hiddenCount = cases.length - MAX_VISIBLE
              return (
                <div key={col.id} className="w-[320px] flex flex-col h-full bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden shrink-0">
                  {/* Column Header */}
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-100/50 flex items-center justify-between shrink-0">
                    <span className="font-sans font-bold text-[14px] text-slate-800 tracking-wide">
                      {col.label}
                    </span>
                    <span className="w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm">
                      {cases.length}
                    </span>
                  </div>

                  {/* Column Body */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar scrollbar-thin scrollbar-thumb-slate-200/80 scrollbar-track-transparent" role="list" aria-label={`Coluna ${col.label}`}>
                    <SortableContext
                      id={col.id}
                      items={visibleCases.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div data-column-id={col.id} className="min-h-full space-y-4">
                        {visibleCases.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-50">
                            <LayoutTemplate className="w-8 h-8 text-slate-400 mb-2" aria-hidden="true" />
                            <span className="font-sans font-medium text-xs text-slate-500">Arraste casos para cá</span>
                          </div>
                        ) : (
                          <>
                            {visibleCases.map((caso) => (
                              <CaseCard
                                key={caso.id}
                                caso={caso}
                                isDragging={activeDragCase?.id === caso.id}
                              />
                            ))}
                            {hiddenCount > 0 && (
                              <div className="text-center py-3 font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                +{hiddenCount} caso{hiddenCount > 1 ? 's' : ''} oculto{hiddenCount > 1 ? 's' : ''}
                              </div>
                            )}
                          </>
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
