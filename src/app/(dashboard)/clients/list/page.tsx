'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { ClientSwitcher } from '@/components/ClientSwitcher'
import { Badge } from '@/components/ui/Badge'
import { maskCPF } from '@/lib/sanitize'
import { formatDate } from '@/lib/utils'
import { Search, Plus, User, FileText, Phone, Mail, Upload } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { DeleteClientModal } from '@/components/client/DeleteClientModal'

interface Client {
  id: string
  name: string
  cpf: string
  phone: string | null
  email: string | null
  priority: 'CRITICAL' | 'ATTENTION' | 'NORMAL'
  cases: Array<{ id: string; status: string; benefitType: string }>
  createdAt: string
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

        {/* Data Table / List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full"></div>
              <p className="font-sans font-medium text-slate-500 animate-pulse mt-4">Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-200/60 shadow-sm text-slate-300">
                <User className="w-8 h-8" />
              </div>
              <p className="font-serif font-bold text-slate-900 text-lg">Nenhum cliente encontrado</p>
              <p className="font-sans text-slate-500 text-sm mt-1 max-w-sm font-medium">
                Comece adicionando seu primeiro cliente para gerenciar casos e analisar documentos.
              </p>
              <Link href="/clients/new" className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-2.5 font-sans font-bold text-sm rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors duration-200">
                <Plus className="w-4 h-4" />
                Cadastrar Primeiro Cliente
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Contato</th>
                    <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Prioridade</th>
                    <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Casos Ativos</th>
                    <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider">Cadastrado em</th>
                    <th className="px-6 py-4 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-serif font-bold text-sm shrink-0 flex items-center justify-center shadow-sm group-hover:bg-white group-hover:border-slate-300 transition-colors duration-200">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link 
                              href={`/clients/list/${client.id}`} 
                              className="font-sans font-bold text-sm text-slate-800 hover:text-amber-700 transition-colors duration-200"
                            >
                              {client.name}
                            </Link>
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
                            ariaLabel={`Ações para ${client.name}`}
                            actions={[
                              {
                                label: 'Editar cliente',
                                onClick: () => window.location.href = `/clients/list/${client.id}/edit`,
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
