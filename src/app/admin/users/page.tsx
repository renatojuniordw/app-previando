'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface AdminUser {
  id: string
  name: string | null
  email: string | null
  plan: string
  planStatus: string | null
  isAdmin: boolean
  createdAt: string
  _count: { clients: number; cases: number }
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const load = async (q = search, p = page, plan = planFilter) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), ...(q && { search: q }), ...(plan && { plan }) })
    const r = await fetch(`/api/admin/users?${params}`, { headers: { 'x-admin-secret': ADMIN_SECRET } })
    const data = await r.json()
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleChangePlan = async (userId: string, plan: string) => {
    await fetch(`/api/admin/users/${userId}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ plan }),
    })
    load()
  }

  const handleToggleStatus = async (userId: string, isSuspended: boolean) => {
    await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ action: isSuspended ? 'activate' : 'suspend' }),
    })
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono font-black text-2xl text-white uppercase">Usuários ({total})</h1>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); load(e.target.value, 1) }}
          placeholder="Buscar por nome ou email..."
          className="neo-input max-w-xs"
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); load(search, 1, e.target.value) }}
          className="neo-input w-32"
        >
          <option value="">Todos</option>
          <option value="FREE">FREE</option>
          <option value="SOLO">SOLO</option>
          <option value="PRO">PRO</option>
        </select>
      </div>

      {loading ? (
        <div className="font-mono text-slate-400 animate-pulse py-8 text-center">Carregando...</div>
      ) : (
        <div className="border-2 border-slate-700">
          <div className="grid grid-cols-6 bg-slate-900 px-4 py-2 font-mono font-black text-[10px] uppercase tracking-widest text-slate-400 border-b-2 border-slate-700">
            <span className="col-span-2">USUÁRIO</span>
            <span>PLANO</span>
            <span>CLIENTES</span>
            <span>CADASTRO</span>
            <span>AÇÕES</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="grid grid-cols-6 px-4 py-3 border-b border-slate-800 items-center">
              <div className="col-span-2">
                <p className="font-mono text-sm text-white">{user.name ?? '—'}</p>
                <p className="font-mono text-xs text-slate-400">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={user.plan}
                  onChange={(e) => handleChangePlan(user.id, e.target.value)}
                  className="font-mono text-xs bg-slate-800 border border-slate-600 text-white px-2 py-1"
                >
                  <option value="FREE">FREE</option>
                  <option value="SOLO">SOLO</option>
                  <option value="PRO">PRO</option>
                </select>
              </div>
              <span className="font-mono text-sm text-slate-300">{user._count.clients}</span>
              <span className="font-mono text-xs text-slate-400">{formatDate(user.createdAt)}</span>
              <button
                onClick={() => handleToggleStatus(user.id, user.planStatus === 'SUSPENDED')}
                className={`font-mono font-black text-[10px] uppercase tracking-widest border-2 px-3 py-1 transition-colors ${
                  user.planStatus === 'SUSPENDED'
                    ? 'border-green-700 text-green-400 hover:border-green-500'
                    : 'border-red-800 text-red-400 hover:border-red-600'
                }`}
              >
                {user.planStatus === 'SUSPENDED' ? 'REATIVAR' : 'SUSPENDER'}
              </button>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex gap-2">
          <button
            onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(search, p) }}
            disabled={page === 1}
            className="font-mono text-xs border-2 border-slate-700 text-slate-400 px-3 py-1 disabled:opacity-30"
          >
            ← ANT
          </button>
          <span className="font-mono text-xs text-slate-400 py-1">{page}/{pages}</span>
          <button
            onClick={() => { const p = Math.min(pages, page + 1); setPage(p); load(search, p) }}
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
