'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  FolderOpen,
  FileText,
  Calculator,
  History,
  MessageSquare,
  CheckSquare,
  HeartPulse,
  FileUp,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimelineEvent {
  id: string
  type: string
  category: string
  title: string
  description: string
  date: string
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; dotColor: string }> = {
  case: { icon: <FolderOpen className="w-4 h-4" />, color: 'text-slate-600', dotColor: 'bg-slate-400' },
  cnis: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-600', dotColor: 'bg-blue-500' },
  calculation: { icon: <Calculator className="w-4 h-4" />, color: 'text-emerald-600', dotColor: 'bg-emerald-500' },
  retroactive: { icon: <History className="w-4 h-4" />, color: 'text-amber-600', dotColor: 'bg-amber-500' },
  opinion: { icon: <FileText className="w-4 h-4" />, color: 'text-purple-600', dotColor: 'bg-purple-500' },
  bpc: { icon: <HeartPulse className="w-4 h-4" />, color: 'text-rose-600', dotColor: 'bg-rose-500' },
  note: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-cyan-600', dotColor: 'bg-cyan-500' },
  checklist: { icon: <CheckSquare className="w-4 h-4" />, color: 'text-teal-600', dotColor: 'bg-teal-500' },
  document: { icon: <FileUp className="w-4 h-4" />, color: 'text-indigo-600', dotColor: 'bg-indigo-500' },
}

interface Props {
  token: string
}

export function PortalTimeline({ token }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/portal/${token}/timeline`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setEvents(data.events)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token])

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Não foi possível carregar a linha do tempo.</p>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 text-slate-500 mb-4">
        <FolderOpen className="w-4 h-4" aria-hidden="true" />
        <span className="font-sans text-sm font-medium uppercase tracking-wide">
          Linha do Tempo
        </span>
      </div>
      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
        <div className="space-y-4">
          {events.map((event) => {
            const cfg = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.case
            return (
              <div key={event.id} className="flex gap-3">
                <div className={`relative z-10 w-6 h-6 rounded-full ${cfg.dotColor} flex items-center justify-center text-white shrink-0 mt-0.5`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-slate-800">{event.title}</p>
                  {event.description && (
                    <p className="font-sans text-xs text-slate-500 mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                  <p className="font-sans text-[10px] text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(event.date), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
