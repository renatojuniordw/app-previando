'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import {
  DollarSign, Loader2, AlertCircle, CheckCircle2, Clock,
  XCircle, AlertTriangle, TrendingUp, Wallet, Search,
} from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
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

  const load = useCallback(() => {
    setLoading(true)
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
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
  }, [load])

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-0">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <AlertCircle className="h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="font-sans text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-0">

      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">Honorários</h1>
        <p className="mt-1 font-sans text-sm text-slate-500">
          Visão consolidada de todos os honorários de todos os casos.
        </p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCell label="Total Esperado" value={summary.total} icon={<Wallet className="h-4 w-4 text-slate-400" />} />
        <SummaryCell label="Total Recebido" value={summary.paid} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} valueColor="text-emerald-700" highlight="emerald" />
        <SummaryCell label="Total Pendente" value={summary.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} valueColor="text-amber-700" highlight="amber" />
        <SummaryCell label="Taxa de Cobrança" value={summary.collectionRate} icon={<TrendingUp className="h-4 w-4 text-indigo-500" />} valueColor="text-indigo-700" isPercentage />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="fee-search" className="neo-label">Buscar por cliente</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="fee-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome do cliente..."
              className="neo-input pl-9"
            />
          </div>
        </div>

        <div>
          <label htmlFor="fee-status" className="neo-label">Status</label>
          <select
            id="fee-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeeStatus | 'ALL')}
            className="neo-input"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <DatePicker label="De" value={from} onChange={(d) => setFrom(d ? d.toISOString().split('T')[0] : '')} />
        <DatePicker label="Até" value={to} onChange={(d) => setTo(d ? d.toISOString().split('T')[0] : '')} />
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="mt-4 animate-pulse font-sans text-sm font-medium text-slate-500">Carregando honorários...</p>
        </div>
      ) : fees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-250 bg-white py-20 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 shadow-xs">
            <DollarSign className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mb-2 font-serif text-lg font-bold text-slate-900">Nenhum Honorário Encontrado</h2>
          <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-slate-500">
            Ajuste os filtros ou registre honorários dentro de um caso específico.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm" role="table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th scope="col" className="px-4 py-3 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cliente</th>
                    <th scope="col" className="px-4 py-3 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Caso</th>
                    <th scope="col" className="px-4 py-3 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descrição</th>
                    <th scope="col" className="px-4 py-3 text-right font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total</th>
                    <th scope="col" className="px-4 py-3 text-right font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Recebido</th>
                    <th scope="col" className="px-4 py-3 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status</th>
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
                        <td className="px-4 py-3 font-semibold text-slate-800">{fee.case.client.name}</td>
                        <td className="px-4 py-3 text-slate-500">{BENEFIT_DB_LABELS[fee.case.benefitType] ?? fee.case.benefitType}</td>
                        <td className="px-4 py-3 text-slate-600">{fee.description}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(fee.totalAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(fee.paidAmount)}</td>
                        <td className="px-4 py-3">
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
                ],
                onClick: () => router.push(`/cases/${fee.case.id}/honorarios`),
              }
            })}
          />
        </>
      )}
    </div>
  )
}

function SummaryCell({
  label, value, icon, valueColor = 'text-slate-900', highlight, isPercentage,
}: {
  label: string
  value: number
  icon: React.ReactNode
  valueColor?: string
  highlight?: 'emerald' | 'amber'
  isPercentage?: boolean
}) {
  return (
    <div className={cn(
      'rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3',
      highlight === 'emerald' && 'bg-emerald-50/20',
      highlight === 'amber' && 'bg-amber-50/20'
    )}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        <p className={cn('font-mono text-lg font-bold tracking-tight', valueColor)}>
          {isPercentage ? `${value}%` : formatCurrency(value)}
        </p>
      </div>
    </div>
  )
}
