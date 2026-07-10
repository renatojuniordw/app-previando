'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalendarDays, ChevronLeft, ChevronRight, X, Clock, AlertTriangle, CalendarCheck, ListTodo, ExternalLink } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BottomSheet } from '@/components/ui/BottomSheet'

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
  { value: 'deadline', label: 'Prazos', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50/80 text-amber-700 border border-amber-200/50' },
  { value: 'google_event', label: 'Google Agenda', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50/80 text-blue-700 border border-blue-200/50' },
  { value: 'prescription', label: 'Prescrições', dotColor: 'bg-red-500', bgColor: 'bg-red-50/80 text-red-700 border border-red-200/50' },
] as const

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_NAMES = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

const DOT_CLASSES: Record<string, string> = {
  deadline: 'bg-amber-500',
  google_event: 'bg-blue-500',
  prescription: 'bg-red-500',
}

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

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}



function AgendaView({
  eventsByDate,
  onDaySelect,
}: {
  eventsByDate: Record<string, CalendarEvent[]>
  onDaySelect: (dateKey: string) => void
}) {
  const today = new Date()
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  const sortedEntries = useMemo(() => {
    return Object.entries(eventsByDate)
      .map(([key, events]) => ({ key, events, date: parseDateKey(key) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [eventsByDate])

  if (sortedEntries.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Agenda vazia"
        description="Nenhum evento encontrado para este período."
      />
    )
  }

  return (
    <div className="space-y-6">
      {sortedEntries.map(({ key, events, date }) => {
        const isCurrentDay = key === todayKey
        const dayNameShort = WEEKDAYS[date.getDay()]
        const monthName = MONTH_NAMES[date.getMonth()]

        return (
          <div key={key}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm font-mono",
                isCurrentDay
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700'
              )}>
                {date.getDate()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {dayNameShort}, {date.getDate()} {monthName.toLowerCase()}
                  </span>
                  {isCurrentDay && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      hoje
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {events.length} evento{events.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2 ml-[52px]">
              {events.map((ev) => {
                const dotClass = DOT_CLASSES[ev.type] ?? 'bg-slate-400'
                return (
                  <button
                    key={ev.id}
                    onClick={() => onDaySelect(key)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-start gap-3"
                  >
                    <span className={cn("shrink-0 w-2 h-2 rounded-full mt-1.5", dotClass)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{ev.title}</p>
                      {ev.clientName && (
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{ev.clientName}</p>
                      )}
                    </div>
                    {ev.caseId && (
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MobileMonthGrid({
  weeks,
  selectedYear,
  selectedMonth,
  selectedDay,
  eventCountByDay,
  filteredEventsByDate,
  onDaySelect,
}: {
  weeks: Array<Array<{ day: number; empty: boolean; dateKey: string }>>
  selectedYear: number
  selectedMonth: number
  selectedDay: { dateKey: string; day: number } | null
  eventCountByDay: Record<string, number>
  filteredEventsByDate: Record<string, CalendarEvent[]>
  onDaySelect: (dateKey: string, day: number) => void
}) {
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="py-2 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {wd}
          </div>
        ))}
      </div>

      <div className="divide-y divide-slate-100">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7">
            {week.map((cell, cellIdx) => {
              if (cell.empty) {
                return <div key={`e-${weekIdx}-${cellIdx}`} className="min-h-[52px] bg-slate-50/20 border-r border-slate-100 last:border-r-0" />
              }

              const isCurrentDay = isToday(selectedYear, selectedMonth, cell.day)
              const eventCount = eventCountByDay[cell.dateKey] ?? 0
              const isSelected = selectedDay?.dateKey === cell.dateKey

              return (
                <button
                  key={cell.dateKey}
                  onClick={() => onDaySelect(cell.dateKey, cell.day)}
                  className={cn(
                    "min-h-[52px] p-1 border-r border-slate-100 last:border-r-0 relative text-center transition-all duration-200",
                    isSelected
                      ? 'bg-amber-50/20 ring-1 ring-inset ring-amber-400/80 z-10'
                      : isCurrentDay
                        ? 'bg-slate-50/30'
                        : 'bg-white'
                  )}
                >
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono mx-auto transition-all",
                    isCurrentDay
                      ? 'bg-amber-600 text-white shadow-sm'
                      : isSelected
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-slate-700'
                  )}>
                    {cell.day}
                  </span>

                  {eventCount > 0 && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {filteredEventsByDate[cell.dateKey]?.slice(0, 3).map((ev) => (
                        <span key={ev.id} className={cn("w-1 h-1 rounded-full", DOT_CLASSES[ev.type] ?? 'bg-slate-400')} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [selectedDay, setSelectedDay] = useState<{ dateKey: string; day: number } | null>(null)
  const [viewMode, setViewMode] = useState<'agenda' | 'month'>('agenda')
  const [isMobile, setIsMobile] = useState(true)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024)
  }, [])

  useEffect(() => {
    api.get<CalendarData>('/calendar')
      .then((r) => setData(r.data))
      .catch(() => null)
      .finally(() => setLoading(false))

    api.get<{ connected: boolean }>('/calendar/status')
      .then((r) => setGoogleConnected(r.data.connected))
      .catch(() => setGoogleConnected(false))
  }, [])

  const filterOptions = useMemo(
    () => (googleConnected ? FILTER_OPTIONS : FILTER_OPTIONS.filter((opt) => opt.value !== 'google_event')),
    [googleConnected]
  )

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
    setViewMode('agenda')
  }, [])

  const handleDaySelect = useCallback((dateKey: string, day: number) => {
    setSelectedDay({ dateKey, day })
    if (isMobile) {
      setBottomSheetOpen(true)
    }
  }, [isMobile])

  const closeBottomSheet = useCallback(() => {
    setBottomSheetOpen(false)
  }, [])

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth)
  const today = new Date()

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

  const selectedDayEvents = selectedDay?.dateKey
    ? filteredEventsByDate[selectedDay.dateKey] ?? []
    : []

  const selectedDate = selectedDay
    ? new Date(selectedYear, selectedMonth, selectedDay.day)
    : null

  const eventCountByDay = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [dateKey, events] of Object.entries(filteredEventsByDate)) {
      counts[dateKey] = events.length
    }
    return counts
  }, [filteredEventsByDate])

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
    { label: 'Total de eventos', value: totalEventsCount, icon: CalendarCheck, borderHover: 'hover:border-amber-250', bgIcon: 'bg-amber-50 border-amber-100/50', colorIcon: 'text-amber-600' },
    { label: 'Eventos hoje', value: todayEventsCount, icon: Clock, borderHover: 'hover:border-emerald-250', bgIcon: 'bg-emerald-50 border-emerald-100/50', colorIcon: 'text-emerald-600' },
    { label: 'Prazos', value: totalEvents.deadline, icon: ListTodo, borderHover: 'hover:border-amber-250', bgIcon: 'bg-amber-50 border-amber-100/50', colorIcon: 'text-amber-600' },
    { label: 'Prescrições', value: totalEvents.prescription, icon: AlertTriangle, borderHover: 'hover:border-red-250', bgIcon: 'bg-red-50 border-red-100/50', colorIcon: 'text-red-650' },
  ]

  const legendItems = [
    { label: 'Prazo', dotClass: 'bg-amber-500' },
    { label: 'Google Agenda', dotClass: 'bg-blue-500' },
    { label: 'Prescrição', dotClass: 'bg-red-500' },
  ]

  const handleTouchStart_ = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove_ = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd_ = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 60
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        navigateMonth(1)
      } else {
        navigateMonth(-1)
      }
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }, [navigateMonth])

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
      {/* Premium Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <CalendarDays className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Calendário Integrado</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">Visão unificada de prazos, notificações e eventos do escritório.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                "relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
                stat.borderHover
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 font-mono leading-none">{stat.value}</p>
                </div>
                <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-xs", stat.bgIcon)}>
                  <Icon className={cn("w-4.5 h-4.5", stat.colorIcon)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters Bar — scrollable chips on mobile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {filterOptions.map((opt) => {
            const isActive = activeFilters.size === 0 || activeFilters.has(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => toggleFilter(opt.value)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 border shrink-0",
                  isActive
                    ? `${opt.bgColor} shadow-sm`
                    : 'bg-white border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", opt.dotColor, !isActive && 'opacity-40')} />
                {opt.label}
                {totalEvents[opt.value] > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[9px] bold font-mono tracking-tight",
                    isActive
                      ? 'bg-white/80 border border-slate-200/50'
                      : 'bg-slate-100 text-slate-500'
                  )}>
                    {totalEvents[opt.value]}
                  </span>
                )}
              </button>
            )
          })}
          {activeFilters.size > 0 && (
            <>
              <div className="w-px h-6 bg-slate-200 shrink-0" />
              <button
                onClick={() => setActiveFilters(new Set())}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:text-red-750 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Legend for mobile */}
      <div className="flex items-center gap-4 px-1 -mt-2 md:hidden">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", item.dotClass)} />
            <span className="text-[10px] font-semibold text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Mobile View Toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('agenda')}
            className={cn(
              "px-4 py-2 rounded-md text-xs font-bold transition-all",
              viewMode === 'agenda'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              "px-4 py-2 rounded-md text-xs font-bold transition-all",
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Mês
          </button>
        </div>
      </div>

      {/* Main Content — Desktop: grid, Mobile: agenda vs month */}
      {isMobile ? (
        <>
          {/* Mobile Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-300 text-slate-600"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-300 text-slate-600"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center select-none">
              <h2 className="font-serif font-bold text-lg text-slate-900 tracking-tight">
                {MONTH_NAMES[selectedMonth]} <span className="text-slate-400 font-normal font-sans text-base ml-1">{selectedYear}</span>
              </h2>
            </div>

            <button
              onClick={goToToday}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 px-4 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm transition-all"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Hoje</span>
            </button>
          </div>

          <Card variant="light" className="p-0 overflow-hidden shadow-sm border-slate-200/80">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
                <p className="text-sm font-medium text-slate-550">Sincronizando calendário...</p>
              </div>
            ) : viewMode === 'agenda' ? (
              <div
                ref={gridRef}
                onTouchStart={handleTouchStart_}
                onTouchMove={handleTouchMove_}
                onTouchEnd={handleTouchEnd_}
                className="p-4"
              >
                <AgendaView
                  eventsByDate={filteredEventsByDate}
                  onDaySelect={(dateKey) => handleDaySelect(dateKey, parseInt(dateKey.split('-')[2]))}
                />
              </div>
            ) : (
              <div
                ref={gridRef}
                onTouchStart={handleTouchStart_}
                onTouchMove={handleTouchMove_}
                onTouchEnd={handleTouchEnd_}
              >
                <MobileMonthGrid
                  weeks={weeks}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  selectedDay={selectedDay}
                  eventCountByDay={eventCountByDay}
                  filteredEventsByDate={filteredEventsByDate}
                  onDaySelect={handleDaySelect}
                />
              </div>
            )}
          </Card>

          {/* Bottom Sheet for mobile day events */}
          <BottomSheet
            open={bottomSheetOpen}
            onClose={closeBottomSheet}
            title={selectedDate
              ? `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()].toLowerCase()}`
              : 'Eventos do Dia'}
          >
            {selectedDay && selectedDayEvents.length > 0 ? (
              <div className="space-y-3">
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
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Agenda vazia"
                description="Nenhum compromisso ou prazo programado para esta data."
              />
            )}
          </BottomSheet>
        </>
      ) : (
        <>
          {/* Desktop: Original Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column: Calendar Grid */}
            <div className="lg:col-span-2">
              <Card variant="light" className="p-0 overflow-hidden shadow-sm border-slate-200/80">
                {/* Header: Month Navigation */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-350 hover:bg-slate-50 transition-all text-slate-650 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-slate-350 hover:bg-slate-50 transition-all text-slate-655 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      aria-label="Próximo mês"
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="text-center select-none">
                    <h2 className="font-serif font-bold text-lg text-slate-900 tracking-tight">
                      {MONTH_NAMES[selectedMonth]} <span className="text-slate-400 font-normal font-sans text-base ml-1">{selectedYear}</span>
                    </h2>
                  </div>

                  <button
                    onClick={goToToday}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white border border-slate-250 text-slate-700 hover:text-slate-900 hover:border-slate-350 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <Clock className="w-4 h-4 text-slate-500" />
                    Hoje
                  </button>
                </div>

                {loading ? (
                  <div className="py-40 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
                    <p className="text-sm font-medium text-slate-550">Sincronizando calendário...</p>
                  </div>
                ) : (
                  <div className="bg-white">
                    <div className="grid grid-cols-7 border-b border-slate-100">
                      {WEEKDAYS.map((wd) => (
                        <div
                          key={wd}
                          className="px-2 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
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
                              return <div key={`e-${weekIdx}-${cellIdx}`} className="min-h-[120px] bg-slate-50/20 border-r border-slate-100 last:border-r-0" />
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
                                className={cn(
                                  "min-h-[120px] p-2 border-r border-slate-100 last:border-r-0 relative text-left transition-all duration-200 focus:outline-none",
                                  isSelected
                                    ? 'bg-amber-50/20 ring-1 ring-inset ring-amber-400/80 z-10 shadow-inner'
                                    : isCurrentDay
                                      ? 'bg-slate-50/30 hover:bg-slate-50/60'
                                      : 'bg-white hover:bg-slate-50/60'
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all duration-200",
                                    isCurrentDay
                                      ? 'bg-amber-600 text-white shadow-sm'
                                      : isSelected
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'text-slate-700'
                                  )}
                                >
                                  {cell.day}
                                </span>

                                {eventCount > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {events?.slice(0, 3).map((ev) => (
                                      <div
                                        key={ev.id}
                                        className="flex items-center gap-1.5 overflow-hidden"
                                      >
                                        <span className={cn(
                                          "shrink-0 w-1.5 h-1.5 rounded-full",
                                          DOT_CLASSES[ev.type] ?? 'bg-slate-400'
                                        )} />
                                        <span className="text-[10px] font-semibold text-slate-600 truncate leading-relaxed">
                                          {ev.title}
                                        </span>
                                      </div>
                                    ))}
                                    {eventCount > 3 && (
                                      <div className="flex items-center gap-1 px-1 mt-1">
                                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                        <span className="text-[9px] font-bold text-slate-550 uppercase">
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
              <Card variant="light" className="p-0 overflow-hidden flex flex-col h-[calc(100dvh-250px)] lg:h-full max-h-[800px] shadow-sm border-slate-200/80">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900 tracking-tight">
                        {selectedDate
                          ? `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()].toLowerCase()}`
                          : 'Eventos do Dia'}
                      </h3>
                      {selectedDate && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {DAY_NAMES[selectedDate.getDay()]}
                          </p>
                          {!isSameDate(selectedDate, today) && (
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border",
                              selectedDate < today
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            )}>
                              {selectedDate < today ? 'Passado' : 'Futuro'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedDay && (
                      <button
                        onClick={() => setSelectedDay(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-colors focus:outline-none"
                        aria-label="Fechar detalhes"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {selectedDay && selectedDayEvents.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-150 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-100/50 flex items-center justify-center shrink-0">
                        <ListTodo className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-mono">{selectedDayEvents.length}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        evento{selectedDayEvents.length > 1 ? 's' : ''} agendado{selectedDayEvents.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
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
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                        <CalendarDays className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">Agenda vazia</p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                        Nenhum compromisso ou prazo programado para esta data.
                      </p>
                    </div>
                  ) : (
                    <div className="py-20 text-center px-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
                        <CalendarDays className="w-6 h-6 text-amber-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">Selecione um dia</p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                        Clique em qualquer data da grade para visualizar a listagem completa de eventos detalhados.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
    </ErrorBoundary>
  )
}
