'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard'
import { CalendarDays, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'

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
  { value: 'deadline', label: 'Prazos' },
  { value: 'google_event', label: 'Google Agenda' },
  { value: 'prescription', label: 'Prescrições' },
] as const

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

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

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth)
  const today = new Date()

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; empty: boolean; dateKey: string }> = []

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, empty: true, dateKey: '' })
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        empty: false,
        dateKey: formatDateKey(selectedYear, selectedMonth, d),
      })
    }

    return days
  }, [selectedYear, selectedMonth, firstDay, daysInMonth])

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-amber-600" />
          <div>
            <h1 className="font-serif font-bold text-2xl text-slate-900">Calendário</h1>
            <p className="text-sm text-slate-500 font-medium">Visão unificada de prazos e eventos</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeFilters.has(opt.value) || activeFilters.size === 0
          const showActive = activeFilters.size === 0 || activeFilters.has(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => toggleFilter(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                showActive
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
              }`}
            >
              {opt.label}
              {totalEvents[opt.value] > 0 && (
                <span className="text-[10px] opacity-70">({totalEvents[opt.value]})</span>
              )}
            </button>
          )
        })}
        {activeFilters.size > 0 && (
          <button
            onClick={() => setActiveFilters(new Set())}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card variant="light" className="p-0 overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="font-serif font-bold text-lg text-slate-900">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {loading ? (
              <div className="py-24 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
              </div>
            ) : (
              <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="px-2 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((cell, idx) => {
                    if (cell.empty) {
                      return <div key={`empty-${idx}`} className="min-h-[100px] bg-slate-50/50" />
                    }

                    const isCurrentDay = isToday(selectedYear, selectedMonth, cell.day)
                    const eventCount = eventCountByDay[cell.dateKey] ?? 0
                    const isSelected = selectedDay?.dateKey === cell.dateKey

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
                        className={`min-h-[100px] p-1.5 border-b border-r border-slate-100 text-left hover:bg-slate-50 transition-colors relative focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset ${
                          isSelected ? 'bg-amber-50 ring-2 ring-amber-400 ring-inset' : ''
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                            isCurrentDay
                              ? 'bg-amber-600 text-white'
                              : isSelected
                                ? 'text-amber-700'
                                : 'text-slate-700'
                          }`}
                        >
                          {cell.day}
                        </span>
                        {eventCount > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {/* Show up to 2 event dots */}
                            {eventCount <= 2 ? (
                              filteredEventsByDate[cell.dateKey]
                                ?.slice(0, 2)
                                .map((ev) => (
                                  <div
                                    key={ev.id}
                                    className={`h-1.5 rounded-full ${
                                      ev.type === 'deadline'
                                        ? 'bg-amber-400'
                                        : ev.type === 'prescription'
                                          ? 'bg-red-400'
                                          : 'bg-blue-400'
                                    }`}
                                  />
                                ))
                            ) : (
                              <div className="flex items-center gap-0.5 px-1">
                                {filteredEventsByDate[cell.dateKey]
                                  ?.slice(0, 3)
                                  .map((ev) => (
                                    <div
                                      key={ev.id}
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        ev.type === 'deadline'
                                          ? 'bg-amber-400'
                                          : ev.type === 'prescription'
                                            ? 'bg-red-400'
                                            : 'bg-blue-400'
                                      }`}
                                    />
                                  ))}
                                {eventCount > 3 && (
                                  <span className="text-[9px] text-slate-400 font-medium ml-0.5">
                                    +{eventCount - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Selected Day Events Panel */}
        <div className="lg:col-span-1">
          <Card variant="light" className="p-0 overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-serif font-bold text-sm text-slate-900">
                {selectedDate
                  ? `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]}`
                  : 'Eventos do Dia'}
              </h3>
              {selectedDate && !isSameDate(selectedDate, today) && (
                <div className="flex items-center gap-1.5 mt-1">
                  {selectedDate < today ? (
                    <span className="text-[11px] font-medium text-red-500">Passado</span>
                  ) : (
                    <span className="text-[11px] font-medium text-green-500">Futuro</span>
                  )}
                </div>
              )}
              {selectedDay && selectedDayEvents.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {selectedDayEvents.length} evento{selectedDayEvents.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="p-3 space-y-1 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-5 h-5 border-3 border-amber-500 border-t-transparent animate-spin rounded-full" />
                </div>
              ) : selectedDay && selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((ev) => (
                  <CalendarEventCard key={ev.id} event={ev} />
                ))
              ) : selectedDay ? (
                <div className="py-12 text-center">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">Nenhum evento</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Nenhum prazo ou evento neste dia.
                  </p>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    Selecione um dia
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Clique em um dia no calendário para ver os eventos.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
