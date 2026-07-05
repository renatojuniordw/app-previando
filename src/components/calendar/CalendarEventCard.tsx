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

const TYPE_STYLES = {
  deadline: {
    badge: 'bg-amber-100 text-amber-700',
    icon: Clock,
    label: 'Prazo',
    border: 'border-amber-200'
  },
  google_event: {
    badge: 'bg-blue-100 text-blue-700',
    icon: Calendar,
    label: 'Google Agenda',
    border: 'border-blue-200'
  },
  prescription: {
    badge: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
    label: 'Prescrição',
    border: 'border-red-200'
  },
} as const

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const style = TYPE_STYLES[event.type] ?? TYPE_STYLES.deadline
  const Icon = style.icon

  const content = (
    <div className={`group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden flex items-start gap-4`}>
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.badge}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.badge} ${style.border}`}>
            {style.label}
          </span>
          {event.clientName && (
            <span className="text-[11px] font-medium text-slate-500 truncate">
              {event.clientName}
            </span>
          )}
        </div>
        
        <p className="text-sm font-bold text-slate-900 leading-tight mb-1 group-hover:text-amber-700 transition-colors">{event.title}</p>
        
        {event.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      {event.caseId && (
        <div className="shrink-0 pt-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-amber-50 text-slate-400 group-hover:text-amber-600 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  )

  if (event.caseId) {
    return (
      <Link href={`/cases/${event.caseId}`} className="block focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
