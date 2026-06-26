'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
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
import { Clock, FileText, LayoutTemplate } from 'lucide-react'
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

function CaseCard({ caso, isDragging }: { caso: KanbanCase; isDragging?: boolean }) {
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
        <div className={`bg-white border border-slate-200 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-[#EB8B6A] hover:shadow-md transition-all group ${isDragging ? 'shadow-lg ring-2 ring-[var(--color-primary)] border-transparent' : 'shadow-sm'}`}>
          <div className="flex align-items-start justify-content-between mb-3">
            <h4 className="font-serif font-bold text-slate-900 text-[15px] leading-tight group-hover:text-[var(--color-primary-dark)] transition-colors">
              {BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
            </h4>
            <div className="shrink-0 ml-2">
              <Badge variant={badgeConfig.color}>{badgeConfig.label}</Badge>
            </div>
          </div>
          
          <div className="flex align-items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex align-items-center justify-content-center text-slate-600 font-sans font-semibold text-[10px] shrink-0 border border-slate-200">
              {getInitials(caso.client.name)}
            </div>
            <p className="font-sans text-sm text-slate-600 truncate font-medium">{caso.client.name}</p>
          </div>

          <div className="flex align-items-center justify-content-between pt-3 border-t border-slate-50">
            <div className="flex align-items-center gap-1.5 text-slate-400">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-sans text-xs font-medium">Docs</span>
            </div>
            <div className="flex align-items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-sans text-[10px] uppercase font-semibold tracking-wider">
                {new Date(caso.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

function DragOverlayCard({ caso }: { caso: KanbanCase }) {
  const badgeConfig = PRIORITY_STYLES[caso.priority] || PRIORITY_STYLES.NORMAL

  return (
    <div className="bg-white border-2 border-[var(--color-primary)] rounded-xl p-4 shadow-xl rotate-3 opacity-95 w-full cursor-grabbing">
      <div className="flex align-items-start justify-content-between mb-3">
        <h4 className="font-serif font-bold text-slate-900 text-[15px] leading-tight">
          {BENEFIT_SHORT_LABELS[caso.benefitType] ?? caso.benefitType}
        </h4>
        <div className="shrink-0 ml-2">
          <Badge variant={badgeConfig.color}>{badgeConfig.label}</Badge>
        </div>
      </div>
      
      <div className="flex align-items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex align-items-center justify-content-center text-slate-600 font-sans font-semibold text-[10px] shrink-0 border border-slate-200">
          {getInitials(caso.client.name)}
        </div>
        <p className="font-sans text-sm text-slate-600 truncate font-medium">{caso.client.name}</p>
      </div>

      <div className="flex align-items-center justify-content-between pt-3 border-t border-slate-50">
        <div className="flex align-items-center gap-1.5 text-slate-400">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <div className="flex align-items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const findCaseById = (id: string): KanbanCase | undefined => {
    for (const cases of Object.values(casesByStatus)) {
      const found = cases.find((c) => c.id === id)
      if (found) return found
    }
  }

  const findColumnForCase = (id: string): string | undefined => {
    for (const [col, cases] of Object.entries(casesByStatus)) {
      if (cases.find((c) => c.id === id)) return col
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const found = findCaseById(event.active.id as string)
    if (found) setActiveDragCase(found)
  }

  const handleDragOver = (event: DragOverEvent) => {
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
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragCase(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const newCol = COLUMNS.find((c) => c.id === overId)?.id ?? findColumnForCase(overId)

    if (!newCol) return

    const previousState = { ...casesByStatus }

    try {
      await api.patch(`/cases/${activeId}/status`, { status: newCol })
    } catch {
      setCasesByStatus(previousState)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-column">
        <ClientSwitcher />
        <div className="flex-1 flex align-items-center justify-content-center">
          <div className="flex flex-column align-items-center gap-4">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent animate-spin rounded-full"></div>
            <p className="font-sans font-medium text-slate-500 animate-pulse">Carregando quadro...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-column">
      {/* Header */}
      <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight flex align-items-center gap-3">
            Quadro de Casos
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1 font-medium">{totalActive} casos em andamento</p>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <ClientSwitcher />
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map((col) => {
              const cases = casesByStatus[col.id] ?? []
              return (
                <div key={col.id} className="w-[320px] flex flex-column h-full bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden shrink-0">
                  {/* Column Header */}
                  <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-100 flex align-items-center justify-content-between shrink-0">
                    <span className="font-sans font-bold text-[15px] text-slate-800 tracking-wide">
                      {col.label}
                    </span>
                    <span className="w-6 h-6 flex align-items-center justify-content-center font-sans text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm">
                      {cases.length}
                    </span>
                  </div>

                  {/* Column Body */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <SortableContext
                      id={col.id}
                      items={cases.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div data-column-id={col.id} className="min-h-full space-y-4">
                        {cases.length === 0 ? (
                          <div className="h-full flex flex-column align-items-center justify-content-center text-center opacity-50 py-10">
                            <LayoutTemplate className="w-8 h-8 text-slate-400 mb-2" />
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
              <div className="w-[288px]"> {/* Width matches CaseCard container minus padding approx */}
                <DragOverlayCard caso={activeDragCase} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
