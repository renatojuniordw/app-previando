'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const load = useCallback(async (q = search, p = page, plan = planFilter) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), ...(q && { search: q }), ...(plan && { plan }) })
    const { data } = await api.get(`/admin/users?${params}`)
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [search, page, planFilter])

  useEffect(() => { load() }, [load])

  const handleChangePlan = async (userId: string, plan: string) => {
    await api.patch(`/admin/users/${userId}/plan`, { plan })
    load()
  }

  const handleToggleStatus = async (userId: string, isSuspended: boolean) => {
    await api.patch(`/admin/users/${userId}/status`, { action: isSuspended ? 'activate' : 'suspend' })
    load()
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">Usuários</h1>
          <p className="font-sans text-sm text-slate-500 mt-1">{total} usuários cadastrados</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); load(e.target.value, 1) }}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); load(search, 1, e.target.value) }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-sans text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        >
          <option value="">Todos os planos</option>
          <option value="FREE">FREE</option>
          <option value="SOLO">SOLO</option>
          <option value="PRO">PRO</option>
          <option value="PARTNER">PARCEIRO</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
        </div>
      ) : (
        <Card variant="light" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plano</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Clientes</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cadastro</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{user.name ?? '—'}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.plan}
                        onChange={(e) => handleChangePlan(user.id, e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        <option value="FREE">FREE</option>
                        <option value="SOLO">SOLO</option>
                        <option value="PRO">PRO</option>
                        <option value="PARTNER">PARCEIRO</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{user._count.clients}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <span
                        onClick={() => handleToggleStatus(user.id, user.planStatus === 'SUSPENDED')}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          user.planStatus === 'SUSPENDED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {user.planStatus === 'SUSPENDED' ? 'Reativar' : 'Suspender'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Nenhum usuário encontrado</p>
            </div>
          )}
        </Card>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{total} usuários</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(search, p) }}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-700 font-medium">{page}/{pages}</span>
            <button
              onClick={() => { const p = Math.min(pages, page + 1); setPage(p); load(search, p) }}
              disabled={page === pages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
