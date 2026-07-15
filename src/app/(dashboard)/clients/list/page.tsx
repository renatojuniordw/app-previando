'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { ClientSwitcher } from '@/components/ClientSwitcher'
import { Badge } from '@/components/ui/Badge'
import { maskCPF } from '@/lib/sanitize'
import { formatDate, cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { Search, Plus, User, FileText, Phone, Mail, Upload, Lock, AlertTriangle, Check, X, Trash2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
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

export default function ClientsListPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const { addToast } = useToast()

  const blockedCount = clients.filter((c) => !c.active).length

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
      load(search)
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (msg) addToast({ type: 'error', title: 'Não foi possível concluir', message: msg })
    } finally {
      setBulkLoading(false)
    }
  }

  const load = (q?: string) => {
    setLoading(true)
    api.get('/clients', { params: { search: q, limit: 50 } })
      .then((r) => {
        setClients(r.data.clients)
        setTotal(r.data.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    load(e.target.value)
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

        {/* Control Area (Search & Action Buttons) */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Buscar por nome ou CPF..."
              aria-label="Buscar clientes"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-400 text-slate-900"
            />
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link 
              href="/clients/new" 
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-sans font-bold text-sm rounded-lg transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Link>
            <Link
              href="/clients/import"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-sans font-bold text-sm rounded-lg transition-all duration-200 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Importar
            </Link>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <ClientSwitcher />
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
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full"></div>
              <p className="font-sans font-medium text-slate-500 animate-pulse mt-4">Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={User}
              title="Nenhum cliente encontrado"
              description="Comece adicionando seu primeiro cliente para gerenciar casos e analisar documentos."
              action={
                <Link href="/clients/new" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-sans font-bold text-sm rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors duration-200">
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Cliente
                </Link>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          aria-label="Selecionar todos"
                          checked={selectedIds.size > 0 && selectedIds.size === clients.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Contato</th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Prioridade</th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Casos Ativos</th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Cadastrado em</th>
                      <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map((client, index) => (
                      <tr key={client.id} className={cn('hover:bg-slate-50/40 transition-colors group', !client.active && 'bg-slate-50/60')}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            aria-label={`Selecionar ${client.name}`}
                            checked={selectedIds.has(client.id)}
                            onChange={() => toggleSelect(client.id)}
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
                        <td className="px-6 py-4">
                          <Badge variant={PRIORITY_BADGE[client.priority]}>
                            {PRIORITY_LABELS[client.priority]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="font-sans text-sm font-semibold text-slate-700">{client.cases.length}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-sans text-sm text-slate-500 font-medium">
                          {formatDate(client.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/clients/list/${client.id}`}
                              className="p-2 text-slate-450 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-all"
                              aria-label={`Ver detalhes de ${client.name}`}
                            >
                              <FileText className="w-4 h-4" aria-hidden="true" />
                            </Link>
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
                                      load(search)
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
                              load(search)
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
            </>
          )}
        </div>

        <DeleteClientModal
          open={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDeletingClient(null) }}
          client={deletingClient}
          onDeleted={load}
        />
      </div>
    </ErrorBoundary>
  )
}
