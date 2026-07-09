'use client'
import { useEffect, useState, useCallback } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { CreditCard } from 'lucide-react'
import api from '@/lib/api'

interface Payment {
  id: string
  plan: string
  amount: number
  status: string
  paidAt: string | null
  createdAt: string
  user: { name: string | null; email: string | null }
}

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'slate'> = {
  APPROVED: 'green',
  PENDING: 'yellow',
  FAILED: 'red',
  CANCELLED: 'slate',
}

const STATUS_LABEL: Record<string, string> = {
  APPROVED: 'Aprovado',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async (p = page, status = statusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), ...(status && { status }) })
      const { data } = await api.get(`/admin/payments?${params}`)
      setPayments(data.payments ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch {
      setError('Erro ao carregar pagamentos.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const columns: AdminTableColumn<Payment>[] = [
    {
      key: 'user',
      header: 'Usuário',
      render: (p) => (
        <div className="min-w-0">
          <p className="font-sans font-semibold text-sm text-slate-900 truncate">{p.user.name ?? '—'}</p>
          <p className="font-sans text-xs text-slate-500 truncate">{p.user.email}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plano',
      render: (p) => (
        <span className="font-sans text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
          {p.plan}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      render: (p) => <span className="font-mono font-semibold text-sm text-slate-900">{formatCurrency(p.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge variant={STATUS_BADGE[p.status] ?? 'slate'}>{STATUS_LABEL[p.status] ?? p.status}</Badge>,
    },
    {
      key: 'date',
      header: 'Data',
      render: (p) => <span className="font-mono text-sm text-slate-500">{formatDate(p.paidAt ?? p.createdAt)}</span>,
    },
  ]

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos"
        description={`${total} pagamentos registrados`}
        action={
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value) }}
            aria-label="Filtrar por status do pagamento"
            className="px-3 h-10 bg-white border border-slate-200/80 rounded-xl text-sm font-sans text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Todos</option>
            <option value="APPROVED">Aprovado</option>
            <option value="PENDING">Pendente</option>
            <option value="FAILED">Falhou</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        }
      />

      <AdminTable
        columns={columns}
        data={payments}
        rowKey={(p) => p.id}
        loading={loading}
        error={error}
        onRetry={() => load()}
        emptyIcon={CreditCard}
        emptyTitle="Nenhum pagamento encontrado"
        emptyDescription="Ajuste o filtro de status para ver outros resultados."
      />

      <AdminPagination page={page} pages={pages} total={total} itemLabel="pagamentos" onChange={(p) => { setPage(p); load(p) }} />
    </div>
    </ErrorBoundary>
  )
}
