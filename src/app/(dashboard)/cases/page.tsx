'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { useToast } from '@/store/toast'
import { downloadPdf } from '@/lib/download-pdf'
import { FilterSheet } from '@/components/ui/FilterSheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Briefcase, ArrowLeft } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS } from '@/lib/constants'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MobileCardList } from '@/components/ui/MobileCardList'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'PROSPECCAO', label: 'Prospecção' },
  { value: 'ANALISE', label: 'Análise' },
  { value: 'PRONTO_PARA_REQUERER', label: 'Pronto p/ Requerer' },
  { value: 'EM_PROCESSAMENTO', label: 'Em Processamento' },
  { value: 'FINALIZADO', label: 'Finalizado' },
]

interface CaseItem {
  id: string
  status: string
  benefitType: string
  priority: string
  deadlineDate: string | null
  createdAt: string
  selectedRmi: number | null
  client: { id: string; name: string }
}

const ALL_BENEFIT_TYPES = Object.keys(BENEFIT_SHORT_LABELS)
const PAGE_SIZE = 20

const PRIORITY_VARIANT: Record<string, 'red' | 'yellow' | 'slate'> = {
  CRITICAL: 'red',
  ATTENTION: 'yellow',
  NORMAL: 'slate',
}

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'Crítico',
  ATTENTION: 'Atenção',
  NORMAL: 'Normal',
}

const STATUS_BADGE_STYLE: Record<string, string> = {
  PROSPECCAO: 'bg-slate-50 text-slate-600 border-slate-250',
  PROSPECTING: 'bg-slate-50 text-slate-600 border-slate-250',
  ANALISE: 'bg-blue-50 text-blue-700 border-blue-150',
  ANALYSIS: 'bg-blue-50 text-blue-700 border-blue-150',
  PRONTO_PARA_REQUERER: 'bg-amber-50 text-amber-700 border-amber-150',
  READY_TO_REQUEST: 'bg-amber-50 text-amber-700 border-amber-150',
  EM_PROCESSAMENTO: 'bg-lime-50 text-lime-700 border-lime-150',
  PROCESSING: 'bg-lime-50 text-lime-700 border-lime-150',
  FINALIZADO: 'bg-emerald-50 text-emerald-700 border-emerald-150',
  FINISHED: 'bg-emerald-50 text-emerald-700 border-emerald-150',
}

export default function CasesPage() {
  useEffect(() => { document.title = 'Casos — Previando' }, [])
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [statusTarget, setStatusTarget] = useState<{ id: string; status: string } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [cases, setCases] = useState<CaseItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<'client' | 'status' | 'priority' | 'deadlineDate' | 'createdAt'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [statusFilter, setStatusFilter] = useState('')
  const [priority, setPriority] = useState('')
  const [benefitType, setBenefitType] = useState('')
  const [rmiMin, setRmiMin] = useState('')
  const [rmiMax, setRmiMax] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const hasActiveFilters = statusFilter || priority || benefitType || rmiMin || rmiMax || createdFrom || createdTo
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchCases = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { limit: String(PAGE_SIZE), page: String(page) }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter
      if (priority) params.priority = priority
      if (benefitType) params.benefitType = benefitType
      if (rmiMin) params.rmiMin = rmiMin
      if (rmiMax) params.rmiMax = rmiMax
      if (createdFrom) params.createdFrom = createdFrom
      if (createdTo) params.createdTo = createdTo
      params.sortField = sortField
      params.sortDir = sortDir

      const res = await api.get('/cases', { params })
      setCases(res.data.cases ?? [])
      setTotal(res.data.total ?? 0)
    } catch (err) {
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar casos. Tente novamente.' })
      console.error('Fetch cases error:', err)
    }
    setLoading(false)
  }, [addToast, debouncedSearch, statusFilter, priority, benefitType, rmiMin, rmiMax, createdFrom, createdTo, page, sortField, sortDir])

  useEffect(() => { fetchCases() }, [fetchCases])

  const handleStatusChange = async () => {
    if (!statusTarget) return
    setUpdatingStatus(true)
    try {
      await api.patch(`/cases/${statusTarget.id}/status`, { status: statusTarget.status })
      addToast({ type: 'success', title: 'Status alterado', message: `Caso atualizado para ${STATUS_OPTIONS.find(s => s.value === statusTarget.status)?.label ?? statusTarget.status}.` })
      setStatusTarget(null)
      fetchCases()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível alterar o status.' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  function clearFilters() {
    setStatusFilter('')
    setPriority('')
    setBenefitType('')
    setRmiMin('')
    setRmiMax('')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Todos os Casos</h1>
          <p className="font-sans text-sm text-slate-550 mt-0.5 font-medium">
            {total} {total === 1 ? 'caso encontrado' : 'casos encontrados'} em andamento no escritório.
          </p>
        </div>
      </div>

      {/* Control Area (Search & Filters button) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por cliente..."
            aria-label="Buscar casos por nome do cliente"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-400 text-slate-900"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={() => setFilterSheetOpen(true)}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg border transition-all duration-200 shrink-0 w-full sm:w-auto',
            hasActiveFilters
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-850'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
        </button>
      </div>

      {/* Filter Sheet */}
      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filtros Avançados"
        activeCount={[statusFilter, priority, benefitType, rmiMin, rmiMax, createdFrom, createdTo].filter(Boolean).length}
        onClear={() => { clearFilters(); setFilterSheetOpen(false) }}
        onApply={() => setFilterSheetOpen(false)}
        filters={[
          {
            type: 'select',
            id: 'filter-status',
            label: 'Status',
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1) },
            options: STATUS_OPTIONS,
          },
          {
            type: 'select',
            id: 'filter-priority',
            label: 'Prioridade',
            value: priority,
            onChange: (v) => { setPriority(v); setPage(1) },
            options: [
              { value: 'CRITICAL', label: 'Crítico' },
              { value: 'ATTENTION', label: 'Atenção' },
              { value: 'NORMAL', label: 'Normal' },
            ],
          },
          {
            type: 'select',
            id: 'filter-benefit',
            label: 'Tipo de Benefício',
            value: benefitType,
            onChange: (v) => { setBenefitType(v); setPage(1) },
            options: ALL_BENEFIT_TYPES.map((t) => ({ value: t, label: BENEFIT_SHORT_LABELS[t] })),
          },
          {
            type: 'number',
            id: 'filter-rmi-min',
            label: 'RMI mínima (R$)',
            value: rmiMin,
            onChange: (v) => { setRmiMin(v); setPage(1) },
            placeholder: '0,00',
          },
          {
            type: 'number',
            id: 'filter-rmi-max',
            label: 'RMI máxima (R$)',
            value: rmiMax,
            onChange: (v) => { setRmiMax(v); setPage(1) },
            placeholder: '99999,00',
          },
          {
            type: 'date',
            id: 'filter-created-from',
            label: 'Criado a partir de',
            value: createdFrom,
            onChange: (v) => { setCreatedFrom(v); setPage(1) },
          },
          {
            type: 'date',
            id: 'filter-created-to',
            label: 'Criado até',
            value: createdTo,
            onChange: (v) => { setCreatedTo(v); setPage(1) },
          },
        ]}
      />

      <ErrorBoundary>
        {/* Table Card */}
        <Card variant="light" className="p-0 border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
              <p className="font-sans font-medium text-slate-500 animate-pulse mt-4">Carregando processos...</p>
            </div>
          ) : cases.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Nenhum caso encontrado"
              description="Tente ajustar seus filtros de busca ou adicione um novo caso a partir do cadastro do cliente."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      {([
                        { label: 'Cliente', field: 'client' },
                        { label: 'Benefício', field: null },
                        { label: 'Status', field: 'status' },
                        { label: 'Prioridade', field: 'priority' },
                        { label: 'RMI Calculada', field: null },
                        { label: 'Prazo', field: 'deadlineDate' },
                        { label: 'Criado em', field: 'createdAt' },
                      ] as { label: string; field: typeof sortField | null }[]).map(({ label, field }) => (
                        <th
                          key={label}
                          className={cn(
                            'px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider',
                            field && 'cursor-pointer select-none hover:text-slate-700 transition-colors'
                          )}
                          onClick={field ? () => handleSort(field) : undefined}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {label}
                            {field && sortField === field && (
                              <span className="text-amber-600 font-extrabold">{sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                            {field && sortField !== field && <span className="text-slate-300">↕</span>}
                          </span>
                        </th>
                      ))}
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-6 py-4">
                          <Link 
                            href={`/cases/${c.id}`} 
                            className="font-sans font-bold text-sm text-slate-800 hover:text-amber-700 transition-colors"
                          >
                            {c.client.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-650 font-medium">
                          {BENEFIT_SHORT_LABELS[c.benefitType] ?? c.benefitType}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-wider',
                            STATUS_BADGE_STYLE[c.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                          )}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={PRIORITY_VARIANT[c.priority] ?? 'slate'}>
                            {PRIORITY_LABEL[c.priority] ?? c.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-700 font-mono">
                          {c.selectedRmi ? formatCurrency(c.selectedRmi) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                          {c.deadlineDate ? formatDate(c.deadlineDate) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ActionsDropdown
                            ariaLabel={`Ações para caso de ${c.client.name}`}
                            actions={[
                              {
                                label: 'Alterar Status',
                                onClick: () => setStatusTarget({ id: c.id, status: c.status }),
                              },
                              {
                                label: 'Exportar PDF',
                                onClick: () => downloadPdf(c.id).then((ok) => {
                                  if (!ok) addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })
                                }),
                              },
                              {
                                label: 'Acessar Cálculo',
                                onClick: () => router.push(`/cases/${c.id}/calculator`),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <MobileCardList
                cards={cases.map((c) => ({
                  id: c.id,
                  primary: c.client.name,
                  secondary: BENEFIT_SHORT_LABELS[c.benefitType] ?? c.benefitType,
                  badge: (
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider',
                        STATUS_BADGE_STYLE[c.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                      )}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      <Badge variant={PRIORITY_VARIANT[c.priority] ?? 'slate'}>
                        {PRIORITY_LABEL[c.priority] ?? c.priority}
                      </Badge>
                    </div>
                  ),
                  fields: [
                    ...(c.selectedRmi ? [{ label: 'RMI', value: formatCurrency(c.selectedRmi) }] : []),
                    { label: 'Prazo', value: c.deadlineDate ? formatDate(c.deadlineDate) : '—' },
                    { label: 'Criado em', value: formatDate(c.createdAt) },
                  ],
                  href: `/cases/${c.id}`,
                  actions: (
                    <ActionsDropdown
                      ariaLabel={`Ações para caso de ${c.client.name}`}
                      actions={[
                        { label: 'Alterar Status', onClick: () => setStatusTarget({ id: c.id, status: c.status }) },
                        {
                          label: 'Exportar PDF',
                          onClick: () => downloadPdf(c.id).then((ok) => {
                            if (!ok) addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })
                          }),
                        },
                        { label: 'Acessar Cálculo', onClick: () => router.push(`/cases/${c.id}/calculator`) },
                      ]}
                    />
                  ),
                }))}
              />
            </>
          )}
        </Card>

        {/* Modal Alterar Status */}
        <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title="Alterar Status do Caso">
          <div className="space-y-4">
            <div>
              <label className="block font-sans font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Novo Status</label>
              <select
                value={statusTarget?.status ?? ''}
                onChange={(e) => setStatusTarget((prev) => prev ? { ...prev, status: e.target.value } : null)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-805 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStatusTarget(null)} className="flex-1 font-sans font-bold text-xs h-10">
                Cancelar
              </Button>
              <Button onClick={handleStatusChange} loading={updatingStatus} className="flex-1 bg-slate-900 hover:bg-slate-850 border-slate-900 font-sans font-bold text-xs h-10 shadow-sm text-white">
                Salvar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-medium">{total} casos no total</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 hover:text-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-xs text-slate-700 font-bold font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 hover:text-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                aria-label="Próxima página"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </div>
  )
}
