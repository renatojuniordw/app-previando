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
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { BENEFIT_SHORT_LABELS, STATUS_LABELS } from '@/lib/constants'

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

function formatCurrency(val: number | null) {
  if (!val) return '—'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CasesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [statusTarget, setStatusTarget] = useState<{ id: string; status: string } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [cases, setCases] = useState<CaseItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
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

  // Debounce search: aguarda 350ms após o usuário parar de digitar
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

      const res = await api.get('/cases', { params })
      setCases(res.data.cases ?? [])
      setTotal(res.data.total ?? 0)
    } catch { /* noop */ }
    setLoading(false)
  }, [debouncedSearch, statusFilter, priority, benefitType, rmiMin, rmiMax, createdFrom, createdTo, page])

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
  }

  const sortedCases = [...cases].sort((a, b) => {
    let cmp = 0
    if (sortField === 'client') cmp = a.client.name.localeCompare(b.client.name, 'pt-BR')
    else if (sortField === 'status') cmp = a.status.localeCompare(b.status)
    else if (sortField === 'priority') {
      const order = { CRITICAL: 0, ATTENTION: 1, NORMAL: 2 }
      cmp = (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3)
    }
    else if (sortField === 'deadlineDate') {
      const da = a.deadlineDate ? new Date(a.deadlineDate).getTime() : Infinity
      const db = b.deadlineDate ? new Date(b.deadlineDate).getTime() : Infinity
      cmp = da - db
    }
    else if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Todos os Casos</h1>
          <p className="font-sans text-sm text-slate-500 mt-1">{total} caso{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex align-items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por cliente..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex align-items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors shrink-0 ${hasActiveFilters ? 'bg-[var(--color-primary-tint)] border-[#EB8B6A] text-[var(--color-primary-dark)]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
          </button>
        </div>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <Card variant="light" className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]">
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Prioridade</label>
              <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1) }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]">
                <option value="">Todas</option>
                <option value="CRITICAL">Crítico</option>
                <option value="ATTENTION">Atenção</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tipo de Benefício</label>
              <select value={benefitType} onChange={(e) => { setBenefitType(e.target.value); setPage(1) }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]">
                <option value="">Todos</option>
                {ALL_BENEFIT_TYPES.map((t) => (
                  <option key={t} value={t}>{BENEFIT_SHORT_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">RMI mínima (R$)</label>
              <input type="number" value={rmiMin} onChange={(e) => { setRmiMin(e.target.value); setPage(1) }} placeholder="0,00" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">RMI máxima (R$)</label>
              <input type="number" value={rmiMax} onChange={(e) => { setRmiMax(e.target.value); setPage(1) }} placeholder="99999,00" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Criado a partir de</label>
              <input type="date" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(1) }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Criado até</label>
              <input type="date" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(1) }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]" />
            </div>
            <div className="col-span-2 flex align-items-end">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex align-items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  <X className="w-4 h-4" />
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Tabela */}
      <Card variant="light" className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex align-items-center justify-content-center">
            <div className="w-6 h-6 border-4 border-[var(--color-primary)] border-t-transparent animate-spin rounded-full" />
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-slate-700">Nenhum caso encontrado</p>
            <p className="text-sm text-slate-500 mt-1">Ajuste os filtros ou cadastre um cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
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
                      className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider ${field ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                      onClick={field ? () => handleSort(field) : undefined}
                    >
                      <span className="inline-flex align-items-center gap-1">
                        {label}
                        {field && sortField === field && (
                          <span className="text-[var(--color-primary)]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                        {field && sortField !== field && <span className="text-slate-300">↕</span>}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/cases/${c.id}`} className="font-semibold text-sm text-slate-900 hover:text-[var(--color-primary)] transition-colors">
                        {c.client.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{BENEFIT_SHORT_LABELS[c.benefitType] ?? c.benefitType}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex align-items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={PRIORITY_VARIANT[c.priority] ?? 'slate'}>
                        {PRIORITY_LABEL[c.priority] ?? c.priority}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-green-700">{formatCurrency(c.selectedRmi)}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {c.deadlineDate ? formatDate(c.deadlineDate) : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
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
        )}
      </Card>

      {/* Modal Alterar Status */}
      <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title="Alterar Status do Caso">
        <div className="space-y-4">
          <div>
            <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Novo Status</label>
            <select
              value={statusTarget?.status ?? ''}
              onChange={(e) => setStatusTarget((prev) => prev ? { ...prev, status: e.target.value } : null)}
              className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleStatusChange} loading={updatingStatus} className="flex-1">
              SALVAR
            </Button>
            <Button variant="outline" onClick={() => setStatusTarget(null)} className="flex-1">
              CANCELAR
            </Button>
          </div>
        </div>
      </Modal>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex align-items-center justify-content-between">
          <span className="text-sm text-slate-500">{total} casos no total</span>
          <div className="flex align-items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="text-sm text-slate-700 font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
