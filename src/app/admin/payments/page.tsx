'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'

interface Payment {
  id: string
  plan: string
  amount: number
  status: string
  paidAt: string | null
  createdAt: string
  user: { name: string | null; email: string | null }
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async (p = page, status = statusFilter) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), ...(status && { status }) })
    const r = await fetch(`/api/admin/payments?${params}`)
    const data = await r.json()
    setPayments(data.payments ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex align-items-center justify-content-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">Pagamentos</h1>
          <p className="font-sans text-sm text-slate-500 mt-1">{total} pagamentos registrados</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-sans text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
        >
          <option value="">Todos</option>
          <option value="APPROVED">Aprovado</option>
          <option value="PENDING">Pendente</option>
          <option value="FAILED">Falhou</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div className="flex align-items-center justify-content-center py-16">
          <div className="w-6 h-6 border-4 border-[var(--color-primary)] border-t-transparent animate-spin rounded-full" />
        </div>
      ) : (
        <Card variant="light" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plano</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm text-slate-900">{p.user.name ?? '—'}</p>
                      <p className="text-xs text-slate-500">{p.user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {p.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-sm text-slate-900">{formatBRL(p.amount)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_BADGE[p.status] ?? 'slate'}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <div className="py-16 text-center">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Nenhum pagamento encontrado</p>
            </div>
          )}
        </Card>
      )}

      {pages > 1 && (
        <div className="flex align-items-center justify-content-between">
          <span className="text-sm text-slate-500">{total} pagamentos</span>
          <div className="flex align-items-center gap-2">
            <button
              onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p) }}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 neo-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-700 font-medium">{page}/{pages}</span>
            <button
              onClick={() => { const p = Math.min(pages, page + 1); setPage(p); load(p) }}
              disabled={page === pages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 neo-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
