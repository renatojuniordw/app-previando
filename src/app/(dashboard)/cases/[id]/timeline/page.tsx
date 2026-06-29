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
  bg: string
  border: string
}> = {
  case: { icon: FolderOpen, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
  cnis: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300' },
  calculation: { icon: Calculator, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300' },
  note: { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  checklist: { icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  opinion: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-300' },
  simulation: { icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-300' },
  retroactive: { icon: History, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-300' },
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
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card variant="light" className="p-6 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{error}</p>
        </Card>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-8">
        <Card variant="light" className="p-8 text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhum evento registrado ainda.</p>
        </Card>
      </div>
    )
  }

  const groups = groupByDate(events)

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="font-serif font-bold text-2xl text-slate-900">Timeline do Caso</h2>
        <p className="text-sm text-slate-500 mt-1">
          Histórico cronológico de todas as atividades — {events.length} evento{events.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-8">
        {groups.map(([dateKey, dayEvents]) => {
          const date = new Date(dateKey + 'T12:00:00')
          return (
            <div key={dateKey}>
              <p className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 sticky top-0 bg-slate-50 py-1">
                {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>

              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

                <div className="space-y-4">
                  {dayEvents.map((ev) => {
                    const cfg = CATEGORY_CONFIG[ev.category] ?? CATEGORY_CONFIG.case
                    const Icon = cfg.icon

                    return (
                      <div key={ev.id} className="flex gap-4">
                        <div className={`relative z-10 w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-sans font-semibold text-sm text-slate-800 leading-snug">
                                {ev.title}
                              </p>
                              <span className="font-sans text-xs text-slate-400 shrink-0">
                                {format(new Date(ev.date), 'HH:mm')}
                              </span>
                            </div>
                            {ev.description && (
                              <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed">
                                {ev.description}
                              </p>
                            )}
                          </div>
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
