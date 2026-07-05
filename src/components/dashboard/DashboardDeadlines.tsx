import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { Clock, Calendar } from 'lucide-react'
import Link from 'next/link'
import { daysUntil } from '@/lib/utils'

interface Deadline {
  id: string
  deadlineDate: string
  client: { name: string }
}

interface CalendarEventItem {
  id: string
  title: string
  date: string
}

interface UpcomingEvents {
  deadlines: Deadline[]
  calendarEvents: CalendarEventItem[]
}

export const DashboardDeadlines = memo(function DashboardDeadlines({ events }: { events: UpcomingEvents }) {
  const total = events.deadlines.length + events.calendarEvents.length
  if (!total) return null

  return (
    <Card variant="light" className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm rounded-xl">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="font-serif font-bold text-base text-slate-900">Prazos e Eventos</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{total} nos próximos 7 dias</span>
      </div>
      <div className="divide-y divide-slate-100">
        {events.deadlines.map((d) => {
          const days = daysUntil(d.deadlineDate)
          return (
            <Link
              key={`dl-${d.id}`}
              href={`/cases/${d.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/70 transition-colors duration-200 group"
            >
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  days <= 1
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : days <= 3
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200/60'
                }`}
              >
                {days}d
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-amber-700 transition-colors duration-200">{d.client.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {new Date(d.deadlineDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                Prazo
              </span>
            </Link>
          )
        })}
        {events.calendarEvents.map((ev) => {
          const days = daysUntil(ev.date)
          return (
            <div
              key={`cal-${ev.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/70 transition-colors duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg border bg-slate-50 text-slate-600 border-slate-200/60 flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{ev.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {new Date(ev.date).toLocaleDateString('pt-BR')} ({days}d)
                </p>
              </div>
              <span className="text-[9px] font-extrabold text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                Agenda
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
})
