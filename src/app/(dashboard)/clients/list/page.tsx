'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ClientSwitcher } from '@/components/ClientSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { maskCPF } from '@/lib/sanitize'
import { formatDate, cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { Search, Plus, User, FileText, Phone, Mail, Upload, Lock, AlertTriangle, Check, X, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { Tooltip } from '@/components/ui/Tooltip'
import { MobileCardList } from '@/components/ui/MobileCardList'
import { DeleteClientModal } from '@/components/client/DeleteClientModal'
import { useToast } from '@/store/toast'

interface Client {
  id: string
  name: string
  cpf: string
  phone: string | null
  email: string | null
  priority: 'CRITICAL' | 'ATTENTION' | 'NORMAL'
  cases: Array<{ id: string; status: string; benefitType: string }>
  createdAt: string
  active: boolean
}

interface SortConfig {
  key: 'name' | 'priority' | 'createdAt'
  order: 'asc' | 'desc'
}

const PRIORITY_BADGE: Record<string, 'red' | 'yellow' | 'slate'> = {
  CRITICAL: 'red',
  ATTENTION: 'yellow',
  NORMAL: 'slate',
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico',
  ATTENTION: 'Atenção',
  NORMAL: 'Normal',
}

const PRIORITY_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'CRITICAL', label: 'Crítico' },
  { value: 'ATTENTION', label: 'Atenção' },
  { value: 'NORMAL', label: 'Normal' },
]

const ACTIVE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Bloqueados' },
]

const SORT_OPTIONS: { key: SortConfig['key']; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'createdAt', label: 'Data' },
]

export default function ClientsListPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [sort, setSort] = useState<SortConfig>({ key: 'name', order: 'asc' })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const { addToast } = useToast()

  useKeyboardShortcuts([
    { keys: ['N'], description: 'Novo cliente', action: () => router.push('/clients/new') },
    { keys: ['I'], description: 'Importar clientes', action: () => router.push('/clients/import') },
    { keys: ['/'], description: 'Focar busca', action: () => searchRef.current?.focus(), enabled: true },
  ])

  const blockedCount = clients.filter((c) => !c.active).length

  const load = useCallback(async (opts?: {
    q?: string
    p?: number
    priority?: string
    active?: string
    sort?: SortConfig
  }) => {
    setLoading(true)
    const params: Record<string, string> = {
      search: opts?.q ?? search,
      page: String(opts?.p ?? page),
      limit: '50',
      sortBy: opts?.sort?.key ?? sort.key,
      sortOrder: opts?.sort?.order ?? sort.order,
    }
    if (opts?.priority ?? priorityFilter) params.priority = opts?.priority ?? priorityFilter
    if (opts?.active ?? activeFilter) params.active = opts?.active ?? activeFilter

    try {
      const r = await api.get('/clients', { params })
      setClients(r.data.clients)
      setTotal(r.data.total)
      setTotalPages(r.data.totalPages)
      if (opts?.p) setPage(opts.p)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search, page, priorityFilter, activeFilter, sort])

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (value: string) => {
    setSearch(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      load({ q: value, p: 1 })
      setPage(1)
    }, 300)
  }

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value)
    load({ priority: value, p: 1 })
    setPage(1)
  }

  const handleActiveChange = (value: string) => {
    setActiveFilter(value)
    load({ active: value, p: 1 })
    setPage(1)
  }

  const handleSort = (key: SortConfig['key']) => {
    const order = sort.key === key && sort.order === 'asc' ? 'desc' : 'asc'
    setSort({ key, order })
    load({ sort: { key, order }, p: 1 })
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    load({ p: newPage })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === clients.length ? new Set() : new Set(clients.map((c) => c.id))))
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.size === 0) return
    if (action === 'delete' && !window.confirm(`Excluir ${selectedIds.size} cliente(s) selecionado(s)? Esta ação não pode ser desfeita.`)) {
      return
    }
    setBulkLoading(true)
    try {
      await api.post('/clients/bulk', { ids: Array.from(selectedIds), action })
      addToast({ type: 'success', title: 'Feito', message: 'Clientes atualizados com sucesso.' })
      setSelectedIds(new Set())
      load()
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (msg) addToast({ type: 'error', title: 'Não foi possível concluir', message: msg })
    } finally {
      setBulkLoading(false)
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: SortConfig['key'] }) => {
    if (sort.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
    return sort.order === 'asc'
      ? <ArrowUp className="w-3 h-3 text-amber-600" />
      : <ArrowDown className="w-3 h-3 text-amber-600" />
  }

  const selectAllRef = useRef<HTMLInputElement>(null)
  const isSearching = search.length > 0
  const isFiltered = priorityFilter || activeFilter || isSearching
  const someSelected = selectedIds.size > 0 && selectedIds.size < clients.length
  const allSelected = selectedIds.size === clients.length && clients.length > 0

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  const countByPriority = {
    CRITICAL: clients.filter((c) => c.priority === 'CRITICAL').length,
    ATTENTION: clients.filter((c) => c.priority === 'ATTENTION').length,
    NORMAL: clients.filter((c) => c.priority === 'NORMAL').length,
  }

  const countByActive = {
    true: clients.filter((c) => c.active).length,
    false: clients.filter((c) => !c.active).length,
  }

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Clientes</h1>
            <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">
              {total} {total === 1 ? 'cliente cadastrado' : 'clientes cadastrados'} na sua base de dados.
            </p>
          </div>
        </div>

        {/* Control Area */}
        <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {/* Search + Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por nome ou CPF... (/ para focar)"
                aria-label="Buscar clientes"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {(total > 0 || isFiltered) && (
                <Tooltip content="Atalho: N" position="bottom">
                  <Link href="/clients/new">
                    <Button variant="dark" size="md">
                      <Plus className="w-4 h-4" />
                      Novo Cliente
                    </Button>
                  </Link>
                </Tooltip>
              )}
              <Tooltip content="Atalho: I" position="bottom">
                <Link href="/clients/import">
                  <Button variant="outline" size="md">
                    <Upload className="w-4 h-4" />
                    Importar
                  </Button>
                </Link>
              </Tooltip>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filtros</span>

            <div className="flex gap-1">
              {PRIORITY_FILTERS.map((f) => {
                const count = f.value ? countByPriority[f.value as keyof typeof countByPriority] : clients.length
                return (
                  <button
                    key={f.value}
                    onClick={() => handlePriorityChange(f.value)}
                    className={cn(
                      'px-3 py-1.5 font-sans text-xs font-bold rounded-lg border transition-all',
                      priorityFilter === f.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {f.label}{count > 0 && ` (${count})`}
                  </button>
                )
              })}
            </div>

            <div className="w-px h-6 bg-slate-200" />

            <div className="flex gap-1">
              {ACTIVE_FILTERS.map((f) => {
                const count = f.value !== '' ? countByActive[f.value as keyof typeof countByActive] : clients.length
                return (
                  <button
                    key={f.value}
                    onClick={() => handleActiveChange(f.value)}
                    className={cn(
                      'px-3 py-1.5 font-sans text-xs font-bold rounded-lg border transition-all',
                      activeFilter === f.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {f.label}{count > 0 && ` (${count})`}
                  </button>
                )
              })}
            </div>

            {isFiltered && (
              <button
                onClick={() => {
                  setSearch('')
                  setPriorityFilter('')
                  setActiveFilter('')
                  setSort({ key: 'name', order: 'asc' })
                  load({ q: '', p: 1, priority: '', active: '', sort: { key: 'name', order: 'asc' } })
                  setPage(1)
                }}
                className="px-3 py-1.5 font-sans text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium font-sans border-t border-slate-100 pt-3">
            <span className="text-slate-300 font-bold">Atalhos:</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600">N</kbd> Novo</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600">I</kbd> Importar</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600">/</kbd> Buscar</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600">?</kbd> Todos os atalhos</span>
          </div>
        </div>

        {/* View Switcher + Results count */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <ClientSwitcher />
          {!loading && (
            <span className="font-sans text-xs font-semibold text-slate-400">
              {isFiltered ? `${total} resultado${total === 1 ? '' : 's'}` : ''}
            </span>
          )}
        </div>

        {blockedCount > 0 && (
          <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 rounded-xl shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="font-sans text-sm text-amber-800">
              Você tem <strong>{blockedCount}</strong> {blockedCount === 1 ? 'cliente bloqueado' : 'clientes bloqueados'} por exceder o limite do seu plano.
              Clientes bloqueados ficam somente-leitura. Selecione-os abaixo para ativar (desativando outro) ou excluir, liberando espaço — ou faça upgrade do plano.
            </p>
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-sm">
            <span className="font-sans text-sm font-semibold">{selectedIds.size} selecionado(s)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Ativar
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs font-bold rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Desativar
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs font-bold rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </div>
        )}

        {/* Data Table / List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} columns={6} />
            </div>
          ) : clients.length === 0 ? (
            isFiltered ? (
              <EmptyState
                icon={Search}
                title="Nenhum resultado encontrado"
                description="Tente alterar os filtros ou buscar por outro termo."
                action={
                  <button
                    onClick={() => {
                      setSearch('')
                      setPriorityFilter('')
                      setActiveFilter('')
                      setSort({ key: 'name', order: 'asc' })
                      load({ q: '', p: 1, priority: '', active: '', sort: { key: 'name', order: 'asc' } })
                      setPage(1)
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-sans font-bold text-sm rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors duration-200"
                  >
                    Limpar filtros
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={User}
                title="Nenhum cliente cadastrado"
                description="Comece adicionando seu primeiro cliente para gerenciar casos e analisar documentos."
                action={
                  <Link href="/clients/new" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-sans font-bold text-sm rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors duration-200">
                    <Plus className="w-4 h-4" />
                    Cadastrar Primeiro Cliente
                  </Link>
                }
              />
            )
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-4 py-4 w-10">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          aria-label="Selecionar todos"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </th>
                      {(['name', 'priority', 'createdAt'] as const).map((key) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider cursor-pointer select-none group"
                        >
                          <div className="flex items-center gap-1.5">
                            {SORT_OPTIONS.find((o) => o.key === key)?.label}
                            <SortIcon columnKey={key} />
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Casos Ativos</th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">Contato</div>
                      </th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map((client, index) => (
                      <tr
                        key={client.id}
                        onClick={() => router.push(`/clients/list/${client.id}`)}
                        className={cn(
                          'hover:bg-slate-50/40 transition-colors group cursor-pointer',
                          !client.active && 'bg-slate-50/60'
                        )}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            aria-label={`Selecionar ${client.name}`}
                            checked={selectedIds.has(client.id)}
                            onChange={(e) => { e.stopPropagation(); toggleSelect(client.id) }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-serif font-bold text-sm shrink-0 flex items-center justify-center shadow-sm group-hover:bg-white group-hover:border-slate-300 transition-colors duration-200">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/clients/list/${client.id}`}
                                  className="font-sans font-bold text-sm text-slate-800 hover:text-amber-700 transition-colors duration-200"
                                >
                                  {client.name}
                                </Link>
                                {!client.active && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 font-sans font-bold text-[10px] uppercase tracking-wide rounded-md border border-slate-300 bg-slate-100 text-slate-600">
                                    <Lock className="w-2.5 h-2.5" /> Bloqueado
                                  </span>
                                )}
                              </div>
                              <p className="font-sans text-[11px] text-slate-400 mt-0.5 font-bold tracking-tight">CPF: {maskCPF(client.cpf)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={PRIORITY_BADGE[client.priority]}>
                            {PRIORITY_LABELS[client.priority]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-sans text-sm text-slate-500 font-medium whitespace-nowrap">
                          {formatDate(client.createdAt)}
                        </td>
                        <td className="px-6 py-4 font-sans text-sm text-slate-500 font-medium">
                          <div className="flex gap-1.5">
                            {client.cases.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 font-sans font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                                {client.cases.length}
                              </span>
                            ) : (
                              <span className="font-sans text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {client.phone ? (
                              <div className="flex items-center gap-1.5 font-sans text-xs text-slate-650 font-medium">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {client.phone}
                              </div>
                            ) : (
                              <span className="font-sans text-xs text-slate-400 font-medium">Sem telefone</span>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-1.5 font-sans text-xs text-slate-500">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate max-w-[120px]">{client.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/clients/list/${client.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-slate-450 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-all"
                              aria-label={`Ver detalhes de ${client.name}`}
                            >
                              <FileText className="w-4 h-4" aria-hidden="true" />
                            </Link>
                            <span onClick={(e) => e.stopPropagation()}>
                              <ActionsDropdown
                                showFirstVisitHint={index === 0}
                                ariaLabel={`Ações para ${client.name}`}
                                actions={[
                                  {
                                    label: 'Editar cliente',
                                    onClick: () => window.location.href = `/clients/list/${client.id}/edit`,
                                  },
                                  {
                                    label: client.active ? 'Desativar cliente' : 'Ativar cliente',
                                    onClick: async () => {
                                      try {
                                        await api.patch(`/clients/${client.id}/active`, { active: !client.active })
                                        load()
                                      } catch (err) {
                                        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                                        if (msg) addToast({ type: 'error', title: 'Não foi possível concluir', message: msg })
                                      }
                                    },
                                  },
                                  {
                                    label: 'Excluir cliente',
                                    onClick: () => {
                                      setDeletingClient(client)
                                      setShowDeleteModal(true)
                                    },
                                    variant: 'danger',
                                  },
                                ]}
                              />
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <MobileCardList
                cards={clients.map((client, index) => ({
                  id: client.id,
                  primary: client.name,
                  secondary: client.active ? `CPF: ${maskCPF(client.cpf)}` : undefined,
                  badge: (
                    <div className="flex items-center gap-1.5">
                      <Badge variant={PRIORITY_BADGE[client.priority]}>
                        {PRIORITY_LABELS[client.priority]}
                      </Badge>
                      {!client.active && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-sans font-bold text-[9px] uppercase tracking-wide rounded border border-slate-300 bg-slate-100 text-slate-500">
                          <Lock className="w-2 h-2" /> Bloqueado
                        </span>
                      )}
                    </div>
                  ),
                  fields: [
                    { label: 'Contato', value: client.phone ?? client.email ?? '—' },
                    { label: 'Casos', value: String(client.cases.length) },
                    { label: 'Cadastro', value: formatDate(client.createdAt) },
                    { label: 'CPF', value: maskCPF(client.cpf) },
                  ],
                  href: `/clients/list/${client.id}`,
                  actions: (
                    <ActionsDropdown
                      showFirstVisitHint={index === 0}
                      ariaLabel={`Ações para ${client.name}`}
                      actions={[
                        { label: 'Editar cliente', onClick: () => window.location.href = `/clients/list/${client.id}/edit` },
                        {
                          label: client.active ? 'Desativar cliente' : 'Ativar cliente',
                          onClick: async () => {
                            try {
                              await api.patch(`/clients/${client.id}/active`, { active: !client.active })
                              load()
                            } catch (err) {
                              const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                              if (msg) addToast({ type: 'error', title: 'Não foi possível concluir', message: msg })
                            }
                          },
                        },
                        { label: 'Excluir cliente', onClick: () => { setDeletingClient(client); setShowDeleteModal(true) }, variant: 'danger' },
                      ]}
                    />
                  ),
                }))}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/30">
                  <span className="font-sans text-xs text-slate-500 font-medium">
                    Página {page} de {totalPages} ({total} clientes)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 font-sans text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Anterior
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => (
                          <span key={p} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="px-1 font-sans text-xs text-slate-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={cn(
                                'w-8 h-8 font-sans text-xs font-bold rounded-lg transition-all',
                                p === page
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-100'
                              )}
                            >
                              {p}
                            </button>
                          </span>
                        ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 font-sans text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Próxima
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DeleteClientModal
          open={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDeletingClient(null) }}
          client={deletingClient}
          onDeleted={() => load()}
        />
      </div>
    </ErrorBoundary>
  )
}
