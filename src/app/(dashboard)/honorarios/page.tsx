'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  DollarSign, AlertCircle, CheckCircle2, Clock,
  XCircle, AlertTriangle, TrendingUp, Wallet, Search,
  SlidersHorizontal, WalletCards,
} from 'lucide-react'
import { FilterSheet } from '@/components/ui/FilterSheet'
import { MobileCardList } from '@/components/ui/MobileCardList'
import { formatCurrency, cn } from '@/lib/utils'
import { BENEFIT_DB_LABELS } from '@/lib/constants'

type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'

interface FeeRow {
  id: string
  description: string
  type: string
  totalAmount: number
  paidAmount: number
  dueDate: string | null
  status: FeeStatus
  createdAt: string
  case: {
    id: string
    benefitType: string
    client: { id: string; name: string }
  }
}

interface Summary {
  total: number
  paid: number
  pending: number
  collectionRate: number
}

const STATUS_CONFIG: Record<FeeStatus, { label: string; color: string; bg: string; border: string; icon: typeof Clock }> = {
  PENDING:   { label: 'Pendente',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock },
  PARTIAL:   { label: 'Parcial',    color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: TrendingUp },
  PAID:      { label: 'Pago',       color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  OVERDUE:   { label: 'Atrasado',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertTriangle },
  CANCELLED: { label: 'Cancelado',  color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: XCircle },
}

const STATUS_FILTERS: Array<{ value: FeeStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'PAID', label: 'Pago' },
  { value: 'OVERDUE', label: 'Atrasado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

export default function HonorariosGlobalPage() {
  const router = useRouter()
  const [fees, setFees] = useState<FeeRow[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, pending: 0, collectionRate: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<FeeStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  function clearFilters() {
    setStatusFilter('ALL')
    setSearch('')
    setFrom('')
    setTo('')
  }

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params: Record<string, string> = {}
    if (statusFilter !== 'ALL') params.status = statusFilter
    if (search.trim()) params.search = search.trim()
    if (from) params.from = from
    if (to) params.to = to

    api.get('/fees', { params })
      .then((r) => { setFees(r.data.fees); setSummary(r.data.summary) })
      .catch((e) => setError(e?.response?.data?.error ?? 'Erro ao carregar honorários.'))
      .finally(() => setLoading(false))
  }, [statusFilter, search, from, to])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(load, 300)
    return () => clearTimeout(debounceRef.current)
  }, [load])

  if (error && fees.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <AlertCircle className="h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="font-sans text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <WalletCards className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Honorários</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">
            Visão consolidada de todos os honorários de todos os casos.
          </p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Wallet className="w-4 h-4" />
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider">Total Esperado</span>
          </div>
          <span className="font-mono font-bold text-lg sm:text-xl text-slate-900">{formatCurrency(summary.total)}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider">Recebido</span>
          </div>
          <span className="font-mono font-bold text-lg sm:text-xl text-emerald-700">{formatCurrency(summary.paid)}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="w-4 h-4" />
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider">Pendente</span>
          </div>
          <span className="font-mono font-bold text-lg sm:text-xl text-amber-700">{formatCurrency(summary.pending)}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider">Taxa de Cobrança</span>
          </div>
          <span className="font-mono font-bold text-lg sm:text-xl text-slate-900">{Math.round(summary.collectionRate)}%</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        {/* Desktop filters — linha única */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-3 h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-400 text-slate-900"
            />
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeeStatus | 'ALL')}
            className="h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 focus:outline-none focus:border-slate-400 text-slate-700 font-medium"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="w-px h-6 bg-slate-200" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 focus:outline-none focus:border-slate-400 text-slate-700"
            title="Data inicial"
          />
          <span className="text-xs text-slate-400">até</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 focus:outline-none focus:border-slate-400 text-slate-700"
            title="Data final"
          />
        </div>

        {/* Mobile filter button */}
        <button
          onClick={() => setFilterSheetOpen(true)}
          className="flex md:hidden items-center justify-center gap-2 w-full py-2.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {[statusFilter !== 'ALL' ? statusFilter : '', search, from, to].filter(Boolean).length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
        </button>
      </div>

      {/* Filter Sheet */}
      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filtros"
        activeCount={[statusFilter !== 'ALL' ? statusFilter : '', search, from, to].filter(Boolean).length}
        onClear={() => { clearFilters(); setFilterSheetOpen(false) }}
        onApply={() => setFilterSheetOpen(false)}
        filters={[
          { type: 'text', id: 'filter-search', label: 'Buscar por cliente', value: search, onChange: setSearch, placeholder: 'Nome do cliente...' },
          { type: 'select', id: 'filter-status', label: 'Status', value: statusFilter === 'ALL' ? '' : statusFilter, onChange: (v) => setStatusFilter((v || 'ALL') as FeeStatus | 'ALL'), options: STATUS_FILTERS.filter((s) => s.value !== 'ALL').map((s) => ({ value: s.value, label: s.label })) },
          { type: 'date', id: 'filter-from', label: 'De', value: from, onChange: (v) => setFrom(v) },
          { type: 'date', id: 'filter-to', label: 'Até', value: to, onChange: (v) => setTo(v) },
        ]}
      />

      {/* Table / List */}
      {loading && fees.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-24" />
            ))}
          </div>
          <Skeleton variant="rectangular" className="h-64 w-full rounded-xl" />
        </div>
      ) : fees.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhum Honorário Encontrado"
          description="Ajuste os filtros ou registre honorários dentro de um caso específico."
        />
      ) : (
        <>
          {/* Loading overlay for refresh */}
          {loading && fees.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent animate-spin rounded-full" />
              <p className="font-sans text-xs font-medium">Atualizando...</p>
            </div>
          )}

          {/* Desktop table */}
          <div className={cn('hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm', loading && 'opacity-60 pointer-events-none')}>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm" role="table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th scope="col" className="px-4 py-4 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cliente</th>
                    <th scope="col" className="px-4 py-4 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Caso</th>
                    <th scope="col" className="px-4 py-4 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descrição</th>
                    <th scope="col" className="px-4 py-4 text-right font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total</th>
                    <th scope="col" className="px-4 py-4 text-right font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Recebido</th>
                    <th scope="col" className="px-4 py-4 text-right font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pendente</th>
                    <th scope="col" className="px-4 py-4 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fees.map((fee) => {
                    const cfg = STATUS_CONFIG[fee.status]
                    const Icon = cfg.icon
                    return (
                      <tr
                        key={fee.id}
                        onClick={() => router.push(`/cases/${fee.case.id}/honorarios`)}
                        className="cursor-pointer transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-4 font-semibold text-slate-800">{fee.case.client.name}</td>
                        <td className="px-4 py-4 text-slate-500">{BENEFIT_DB_LABELS[fee.case.benefitType] ?? fee.case.benefitType}</td>
                        <td className="px-4 py-4 text-slate-600">{fee.description}</td>
                        <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">{formatCurrency(fee.totalAmount)}</td>
                        <td className="px-4 py-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(fee.paidAmount)}</td>
                        <td className="px-4 py-4 text-right">
                          {fee.totalAmount - fee.paidAmount > 0 ? (
                            <span className="font-mono font-bold text-amber-700">{formatCurrency(fee.totalAmount - fee.paidAmount)}</span>
                          ) : (
                            <span className="font-mono text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
                            cfg.bg, cfg.color, cfg.border
                          )}>
                            <Icon className="h-3 w-3" aria-hidden="true" />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <MobileCardList
            cards={fees.map((fee) => {
              const cfg = STATUS_CONFIG[fee.status]
              const Icon = cfg.icon
              return {
                id: fee.id,
                primary: fee.case.client.name,
                secondary: `${BENEFIT_DB_LABELS[fee.case.benefitType] ?? fee.case.benefitType} · ${fee.description}`,
                badge: (
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider',
                    cfg.bg, cfg.color, cfg.border
                  )}>
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {cfg.label}
                  </span>
                ),
                fields: [
                  { label: 'Total', value: formatCurrency(fee.totalAmount), className: 'text-right' },
                  { label: 'Recebido', value: formatCurrency(fee.paidAmount), className: 'text-right' },
                  { label: 'Pendente', value: fee.totalAmount - fee.paidAmount > 0 ? formatCurrency(fee.totalAmount - fee.paidAmount) : '—', className: 'text-right' },
                ],
                onClick: () => router.push(`/cases/${fee.case.id}/honorarios`),
              }
            })}
          />
        </>
      )}
    </div>
    </ErrorBoundary>
  )
}
