'use client'

import Link from 'next/link'
import { Calendar, AlertTriangle, Clock, ExternalLink } from 'lucide-react'

interface CalendarEvent {
  id: string
  type: 'deadline' | 'google_event' | 'prescription'
  title: string
  description?: string
  date: string
  caseId?: string
  clientName?: string
}

interface CalendarEventCardProps {
  event: CalendarEvent
}

const TYPE_STYLES: Record<string, { badge: string; icon: typeof Calendar; label: string }> = {
  deadline: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Prazo',
  },
  google_event: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Calendar,
    label: 'Google Agenda',
  },
  prescription: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: 'Prescrição',
  },
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const style = TYPE_STYLES[event.type] ?? TYPE_STYLES.deadline
  const Icon = style.icon

  const content = (
    <div className="group flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
      <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center ${style.badge}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{event.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${style.badge}`}>
            {style.label}
          </span>
          {event.description && (
            <span className="text-[10px] text-slate-400 truncate">{event.description}</span>
          )}
        </div>
      </div>
      {event.caseId && (
        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0 mt-1" />
      )}
    </div>
  )

  if (event.caseId) {
    return (
      <Link href={`/cases/${event.caseId}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}
