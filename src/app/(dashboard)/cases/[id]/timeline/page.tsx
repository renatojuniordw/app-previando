'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import {
  FolderOpen, FileText, Calculator, MessageSquare, CheckSquare,
  BarChart3, History, AlertCircle, Loader2, Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  id: string
  type: string
  category: string
  title: string
  description: string
  date: string
  meta?: Record<string, unknown>
}

const CATEGORY_CONFIG: Record<string, {
  icon: typeof FolderOpen
  color: string
  border: string
}> = {
  case: { icon: FolderOpen, color: 'text-slate-550', border: 'border-slate-300' },
  cnis: { icon: FileText, color: 'text-blue-600', border: 'border-blue-400' },
  calculation: { icon: Calculator, color: 'text-amber-600', border: 'border-amber-450' },
  note: { icon: MessageSquare, color: 'text-indigo-600', border: 'border-indigo-400' },
  checklist: { icon: CheckSquare, color: 'text-emerald-600', border: 'border-emerald-450' },
  opinion: { icon: MessageSquare, color: 'text-slate-700', border: 'border-slate-400' }, // Purple color removed to respect Purple Ban
  simulation: { icon: BarChart3, color: 'text-teal-600', border: 'border-teal-400' },
  retroactive: { icon: History, color: 'text-rose-600', border: 'border-rose-450' },
}

function groupByDate(events: TimelineEvent[]) {
  const groups: Record<string, TimelineEvent[]> = {}
  for (const ev of events) {
    const key = format(new Date(ev.date), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/cases/${id}/timeline`)
      .then((r) => setEvents(r.data.events))
      .catch((e) => setError(e?.response?.data?.error ?? 'Erro ao carregar timeline.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="font-sans font-medium text-slate-500 animate-pulse">Carregando timeline...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card variant="light" className="p-8 text-center border-red-200">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-sans text-sm font-medium text-red-750">{error}</p>
        </Card>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card variant="light" className="p-12 text-center border-slate-200/80 bg-white">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-serif font-bold text-lg text-slate-800">Sem Eventos</h3>
          <p className="font-sans text-xs text-slate-550 mt-1 max-w-xs mx-auto leading-relaxed">
            Ainda não há atividades registradas para este processo.
          </p>
        </Card>
      </div>
    )
  }

  const groups = groupByDate(events)

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="border-b border-slate-205 pb-5">
        <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Timeline do Caso</h2>
        <p className="font-sans text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
          Histórico cronológico e ordenado de todas as atividades e interações do processo — {events.length} evento{events.length !== 1 ? 's' : ''} registrado{events.length !== 1 ? 's' : ''}.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map(([dateKey, dayEvents]) => {
          const date = new Date(dateKey + 'T12:00:00')
          return (
            <div key={dateKey} className="space-y-4">
              <p className="font-sans text-[10px] font-extrabold text-slate-455 uppercase tracking-widest sticky top-0 bg-slate-50/90 backdrop-blur-xs py-2 z-10">
                {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>

              <div className="relative pl-10">
                {/* Timeline Line: Pixel perfect centering with the node circles */}
                <div className="absolute left-[17px] top-0 bottom-0 w-[2px] bg-slate-200/80" />

                <div className="space-y-5">
                  {dayEvents.map((ev) => {
                    const cfg = CATEGORY_CONFIG[ev.category] ?? CATEGORY_CONFIG.case
                    const Icon = cfg.icon

                    return (
                      <div key={ev.id} className="relative">
                        {/* Circle Node: mathematically aligned to sit perfectly on top of the vertical line */}
                        <div className={cn(
                          "absolute -left-[33px] top-2.5 w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center z-15 shadow-sm",
                          cfg.border
                        )}>
                          <Icon className={cn("w-4 h-4", cfg.color)} />
                        </div>

                        {/* Event Card */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-slate-350 hover:shadow-md transition-all duration-300 group">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-sans font-bold text-sm text-slate-800 leading-snug group-hover:text-amber-700 transition-colors">
                              {ev.title}
                            </h4>
                            <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0 mt-0.5">
                              {format(new Date(ev.date), 'HH:mm')}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="font-sans text-xs text-slate-550 mt-1.5 leading-relaxed font-medium">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
