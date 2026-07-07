'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { Headphones, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/store/toast'
import api from '@/lib/api'

interface SupportTicket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string | null; plan: string }
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  WAITING_USER: 'Aguardando Resposta',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

const STATUS_CLASSES: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  WAITING_USER: 'bg-purple-50 text-purple-700 border-purple-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-50 text-slate-500 border-slate-200',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

const PRIORITY_CLASSES: Record<string, string> = {
  LOW: 'bg-slate-50 text-slate-600 border-slate-200',
  NORMAL: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusChange, setStatusChange] = useState<{ ticket: SupportTicket; status: string } | null>(null)
  const [mutating, setMutating] = useState(false)
  const { addToast } = useToast()

  const load = useCallback(async (p = page, status = statusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), ...(status && { status }) })
      const { data } = await api.get(`/admin/support?${params}`)
      setTickets(data.tickets ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch {
      setError('Erro ao carregar chamados.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const confirmStatusChange = async () => {
    if (!statusChange) return
    setMutating(true)
    try {
      await api.patch(`/admin/support/${statusChange.ticket.id}`, { status: statusChange.status })
      addToast({ type: 'success', title: `Chamado alterado para ${STATUS_LABELS[statusChange.status]}.` })
      setStatusChange(null)
      await load()
    } catch {
      addToast({ type: 'error', title: 'Erro ao atualizar chamado.' })
    } finally {
      setMutating(false)
    }
  }

  const columns: AdminTableColumn<SupportTicket>[] = [
    {
      key: 'user',
      header: 'Usuário',
      render: (ticket) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
            {ticket.user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-sm text-slate-900 truncate">{ticket.user.name ?? '—'}</p>
            <p className="font-sans text-xs text-slate-500 truncate">{ticket.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Assunto',
      render: (ticket) => (
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
            className="text-left font-sans text-sm font-medium text-slate-900 truncate hover:text-amber-700 transition-colors cursor-pointer min-w-0"
          >
            {ticket.subject}
          </button>
          {expandedId === ticket.id ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridade',
      render: (ticket) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${PRIORITY_CLASSES[ticket.priority] ?? ''}`}>
          {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ticket) => (
        <select
          value={ticket.status}
          onChange={(e) => setStatusChange({ ticket, status: e.target.value })}
          aria-label="Alterar status"
          className={`text-xs border rounded-lg px-2 py-1.5 font-sans font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 ${STATUS_CLASSES[ticket.status] ?? ''}`}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'createdAt',
      header: 'Data',
      render: (ticket) => (
        <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
          {formatDate(ticket.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Suporte" description={`${total} chamados registrados`} />

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value) }}
          aria-label="Filtrar por status"
          className="px-3 h-10 bg-white border border-slate-200/80 rounded-xl text-sm font-sans text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={tickets}
        rowKey={(ticket) => ticket.id}
        loading={loading}
        error={error}
        onRetry={() => load()}
        emptyIcon={Headphones}
        emptyTitle="Nenhum chamado encontrado"
        emptyDescription="Ajuste os filtros para encontrar o que procura."
      />

      {expandedId && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          {(() => {
            const ticket = tickets.find((t) => t.id === expandedId)
            if (!ticket) return null
            return (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mensagem</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notas internas</p>
                  <textarea
                    defaultValue={ticket.adminNotes ?? ''}
                    rows={3}
                    placeholder="Adicionar notas internas..."
                    onBlur={async (e) => {
                      try {
                        await api.patch(`/admin/support/${ticket.id}`, { adminNotes: e.target.value })
                        addToast({ type: 'success', title: 'Notas salvas.' })
                      } catch {
                        addToast({ type: 'error', title: 'Erro ao salvar notas.' })
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-y"
                  />
                </div>
              </>
            )
          })()}
        </div>
      )}

      <AdminPagination page={page} pages={pages} total={total} itemLabel="chamados" onChange={(p) => { setPage(p); load(p) }} />

      <ConfirmDialog
        open={statusChange !== null}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusChange(null)}
        title="Alterar status do chamado"
        message={statusChange ? `Alterar o status para ${STATUS_LABELS[statusChange.status]}?` : ''}
        confirmLabel="Alterar status"
        variant="warning"
        loading={mutating}
      />
    </div>
  )
}
