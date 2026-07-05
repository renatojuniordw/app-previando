'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard'
import { CalendarDays, ChevronLeft, ChevronRight, X, Clock, AlertTriangle, CalendarCheck, ListTodo, ExternalLink } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface CalendarEvent {
  id: string
  type: 'deadline' | 'google_event' | 'prescription'
  title: string
  description?: string
  date: string
  caseId?: string
  clientName?: string
}

interface CalendarData {
  startDate: string
  endDate: string
  eventsByDate: Record<string, CalendarEvent[]>
}

const FILTER_OPTIONS = [
  { value: 'deadline', label: 'Prazos', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  { value: 'google_event', label: 'Google Agenda', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { value: 'prescription', label: 'Prescrições', dotColor: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
] as const

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_NAMES = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isToday(year: number, month: number, day: number): boolean {
  const d = new Date()
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [selectedDay, setSelectedDay] = useState<{ dateKey: string; day: number } | null>(null)

  useEffect(() => {
    api.get<CalendarData>('/calendar')
      .then((r) => setData(r.data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const toggleFilter = useCallback((type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const filteredEventsByDate = useMemo(() => {
    if (!data) return {}
    if (activeFilters.size === 0) return data.eventsByDate

    const result: Record<string, CalendarEvent[]> = {}
    for (const [dateKey, events] of Object.entries(data.eventsByDate)) {
      const filtered = events.filter((e) => activeFilters.has(e.type))
      if (filtered.length > 0) result[dateKey] = filtered
    }
    return result
  }, [data, activeFilters])

  const navigateMonth = useCallback((direction: -1 | 1) => {
    setSelectedMonth((prev) => {
      const next = prev + direction
      if (next < 0) {
        setSelectedYear((y) => y - 1)
        return 11
      }
      if (next > 11) {
        setSelectedYear((y) => y + 1)
        return 0
      }
      return next
    })
    setSelectedDay(null)
  }, [])

  const goToToday = useCallback(() => {
    const now = new Date()
    setSelectedMonth(now.getMonth())
    setSelectedYear(now.getFullYear())
    setSelectedDay(null)
  }, [])

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth)
  const today = new Date()

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; empty: boolean; dateKey: string }> = []
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, empty: true, dateKey: '' })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        empty: false,
        dateKey: formatDateKey(selectedYear, selectedMonth, d),
      })
    }
    return days
  }, [selectedYear, selectedMonth, firstDay, daysInMonth])

  // Split calendar days into weeks
  const weeks = useMemo(() => {
    const result: Array<Array<{ day: number; empty: boolean; dateKey: string }>> = []
    let currentWeek: Array<{ day: number; empty: boolean; dateKey: string }> = []

    for (const cell of calendarDays) {
      currentWeek.push(cell)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ day: 0, empty: true, dateKey: '' })
      }
      result.push(currentWeek)
    }

    return result
  }, [calendarDays])

  // Get events for selected day
  const selectedDayEvents = selectedDay?.dateKey
    ? filteredEventsByDate[selectedDay.dateKey] ?? []
    : []

  const selectedDate = selectedDay
    ? new Date(selectedYear, selectedMonth, selectedDay.day)
    : null

  // Count events per day (for badges)
  const eventCountByDay = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [dateKey, events] of Object.entries(filteredEventsByDate)) {
      counts[dateKey] = events.length
    }
    return counts
  }, [filteredEventsByDate])

  // Aggregate event counts by type for the header
  const totalEvents = useMemo(() => {
    if (!data) return { deadline: 0, google_event: 0, prescription: 0 }
    const counts = { deadline: 0, google_event: 0, prescription: 0 }
    for (const events of Object.values(data.eventsByDate)) {
      for (const e of events) {
        if (e.type in counts) counts[e.type as keyof typeof counts]++
      }
    }
    return counts
  }, [data])

  const totalEventsCount = useMemo(() => {
    if (!data) return 0
    return Object.values(data.eventsByDate).reduce((sum, events) => sum + events.length, 0)
  }, [data])

  const todayDateKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEventsCount = eventCountByDay[todayDateKey] ?? 0

  const stats = [
    { label: 'Total de eventos', value: totalEventsCount, icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Eventos hoje', value: todayEventsCount, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Prazos', value: totalEvents.deadline, icon: ListTodo, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Prescrições', value: totalEvents.prescription, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200/50">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Calendário</h1>
            <p className="text-sm font-medium text-slate-500">Visão unificada de prazos e eventos</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeFilters.size === 0 || activeFilters.has(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => toggleFilter(opt.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${opt.bgColor} ${opt.textColor} shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${opt.dotColor} ${!isActive && 'opacity-40'}`} />
              {opt.label}
              {totalEvents[opt.value] > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                  isActive
                    ? `${opt.bgColor} ${opt.textColor}`
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {totalEvents[opt.value]}
                </span>
              )}
            </button>
          )
        })}
        {activeFilters.size > 0 && (
          <div className="flex items-center">
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              onClick={() => setActiveFilters(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Calendar Grid */}
        <div className="lg:col-span-2">
          <Card variant="light" className="p-0 overflow-hidden shadow-sm">
            
            {/* Header: Month Navigation */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center select-none">
                <h2 className="font-serif font-bold text-xl text-slate-900 tracking-tight">
                  {MONTH_NAMES[selectedMonth]} <span className="text-slate-400 font-normal">{selectedYear}</span>
                </h2>
              </div>

              <button
                onClick={goToToday}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
              >
                <Clock className="w-4 h-4" />
                Hoje
              </button>
            </div>

            {loading ? (
              <div className="py-40 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 animate-spin rounded-full" />
                <p className="text-sm font-medium text-slate-500">Sincronizando calendário...</p>
              </div>
            ) : (
              <div className="bg-white">
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="px-2 py-3.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-slate-100">
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="grid grid-cols-7">
                      {week.map((cell, cellIdx) => {
                        if (cell.empty) {
                          return <div key={`e-${weekIdx}-${cellIdx}`} className="min-h-[120px] bg-slate-50/40 border-r border-slate-100 last:border-r-0" />
                        }

                        const isCurrentDay = isToday(selectedYear, selectedMonth, cell.day)
                        const eventCount = eventCountByDay[cell.dateKey] ?? 0
                        const isSelected = selectedDay?.dateKey === cell.dateKey
                        const events = filteredEventsByDate[cell.dateKey]

                        return (
                          <button
                            key={cell.dateKey}
                            onClick={() =>
                              setSelectedDay(
                                selectedDay?.dateKey === cell.dateKey
                                  ? null
                                  : { dateKey: cell.dateKey, day: cell.day }
                              )
                            }
                            className={`min-h-[120px] p-2 border-r border-slate-100 last:border-r-0 relative text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset ${
                              isSelected
                                ? 'bg-amber-50 ring-2 ring-inset ring-amber-400 z-10'
                                : isCurrentDay
                                  ? 'bg-amber-50/20 hover:bg-amber-50/50'
                                  : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-200 ${
                                isCurrentDay
                                  ? 'bg-amber-600 text-white shadow-md shadow-amber-200/50'
                                  : isSelected
                                    ? 'bg-amber-200 text-amber-800'
                                    : 'text-slate-700'
                              }`}
                            >
                              {cell.day}
                            </span>

                            {eventCount > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {events?.slice(0, 3).map((ev) => (
                                  <div
                                    key={ev.id}
                                    className="flex items-center gap-1.5 overflow-hidden"
                                  >
                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                                      ev.type === 'deadline' ? 'bg-amber-500' :
                                      ev.type === 'prescription' ? 'bg-red-500' : 'bg-blue-500'
                                    }`} />
                                    <span className="text-[10px] font-medium text-slate-600 truncate">
                                      {ev.title}
                                    </span>
                                  </div>
                                ))}
                                {eventCount > 3 && (
                                  <div className="flex items-center gap-1 px-1 mt-1">
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                                      +{eventCount - 3} mais
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Timeline Stream */}
        <div className="lg:col-span-1">
          <Card variant="light" className="p-0 overflow-hidden flex flex-col h-[calc(100vh-250px)] lg:h-full max-h-[800px] shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 tracking-tight">
                    {selectedDate
                      ? `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()].toLowerCase()}`
                      : 'Eventos do Dia'}
                  </h3>
                  {selectedDate && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {DAY_NAMES[selectedDate.getDay()]}
                      </p>
                      {!isSameDate(selectedDate, today) && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          selectedDate < today
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            selectedDate < today ? 'bg-red-500' : 'bg-emerald-500'
                          }`} />
                          {selectedDate < today ? 'Passado' : 'Futuro'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {selectedDay && (
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                    aria-label="Fechar detalhes"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {selectedDay && selectedDayEvents.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                    <ListTodo className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 tabular-nums">{selectedDayEvents.length}</span>
                  <span className="text-xs font-medium text-slate-500">
                    evento{selectedDayEvents.length > 1 ? 's' : ''} agendado{selectedDayEvents.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/30">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-500 animate-spin rounded-full" />
                </div>
              ) : selectedDay && selectedDayEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayEvents.map((ev, idx) => (
                    <div
                      key={ev.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                    >
                      <CalendarEventCard event={ev} />
                    </div>
                  ))}
                </div>
              ) : selectedDay ? (
                <div className="py-20 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                    <CalendarDays className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Nenhum evento</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    A agenda está livre neste dia.
                  </p>
                </div>
              ) : (
                <div className="py-20 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-200/50">
                    <CalendarDays className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Selecione um dia</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Clique na grade ao lado para visualizar os detalhes dos eventos.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
    </ErrorBoundary>
  )
}
