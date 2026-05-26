'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDate } from '@/lib/utils'

interface Payment {
  id: string
  plan: string
  amount: number
  status: string
  paidAt: string | null
  createdAt: string
  user: { name: string | null; email: string | null }
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
    const r = await fetch(`/api/admin/payments?${params}`, { headers: { 'x-admin-secret': ADMIN_SECRET } })
    const data = await r.json()
    setPayments(data.payments ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const STATUS_COLOR: Record<string, string> = {
    APPROVED: 'text-green-400',
    PENDING: 'text-amber-400',
    FAILED: 'text-red-400',
    CANCELLED: 'text-slate-500',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono font-black text-2xl text-white uppercase">Pagamentos ({total})</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value) }}
          className="neo-input w-36"
        >
          <option value="">Todos</option>
          <option value="APPROVED">Aprovado</option>
          <option value="PENDING">Pendente</option>
          <option value="FAILED">Falhou</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div className="font-mono text-slate-400 animate-pulse py-8 text-center">Carregando...</div>
      ) : (
        <div className="border-2 border-slate-700">
          <div className="grid grid-cols-5 bg-slate-900 px-4 py-2 font-mono font-black text-[10px] uppercase tracking-widest text-slate-400 border-b-2 border-slate-700">
            <span className="col-span-2">USUÁRIO</span>
            <span>PLANO / VALOR</span>
            <span>STATUS</span>
            <span>DATA</span>
          </div>
          {payments.map((p) => (
            <div key={p.id} className="grid grid-cols-5 px-4 py-3 border-b border-slate-800 items-center">
              <div className="col-span-2">
                <p className="font-mono text-sm text-white">{p.user.name ?? '—'}</p>
                <p className="font-mono text-xs text-slate-400">{p.user.email}</p>
              </div>
              <div>
                <p className="font-mono text-sm text-white">{p.plan}</p>
                <p className="font-mono text-xs text-[#ccff00]">{formatBRL(p.amount)}</p>
              </div>
              <span className={`font-mono text-xs uppercase font-bold ${STATUS_COLOR[p.status] ?? 'text-slate-400'}`}>
                {p.status}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
              </span>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="py-8 text-center font-mono text-slate-500">Nenhum pagamento encontrado.</div>
          )}
        </div>
      )}

      {pages > 1 && (
        <div className="flex gap-2">
          <button
            onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p) }}
            disabled={page === 1}
            className="font-mono text-xs border-2 border-slate-700 text-slate-400 px-3 py-1 disabled:opacity-30"
          >
            ← ANT
          </button>
          <span className="font-mono text-xs text-slate-400 py-1">{page}/{pages}</span>
          <button
            onClick={() => { const p = Math.min(pages, page + 1); setPage(p); load(p) }}
            disabled={page === pages}
            className="font-mono text-xs border-2 border-slate-700 text-slate-400 px-3 py-1 disabled:opacity-30"
          >
            PRÓ →
          </button>
        </div>
      )}
    </div>
  )
}
