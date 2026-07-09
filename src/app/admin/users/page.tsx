'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { Search, Users } from 'lucide-react'
import { useToast } from '@/store/toast'
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

const PLAN_LABELS: Record<string, string> = { FREE: 'FREE', SOLO: 'SOLO', PRO: 'PRO', PARTNER: 'PARCEIRO' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [planChange, setPlanChange] = useState<{ user: AdminUser; plan: string } | null>(null)
  const [statusChange, setStatusChange] = useState<{ user: AdminUser; suspend: boolean } | null>(null)
  const [mutating, setMutating] = useState(false)
  const { addToast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (q = search, p = page, plan = planFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), ...(q && { search: q }), ...(plan && { plan }) })
      const { data } = await api.get(`/admin/users?${params}`)
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch {
      setError('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [search, page, planFilter])

  useEffect(() => { load() }, [load])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1); load(value, 1) }, 300)
  }

  const confirmPlanChange = async () => {
    if (!planChange) return
    setMutating(true)
    try {
      await api.patch(`/admin/users/${planChange.user.id}/plan`, { plan: planChange.plan })
      addToast({ type: 'success', title: `Plano de ${planChange.user.name ?? planChange.user.email} atualizado para ${PLAN_LABELS[planChange.plan]}.` })
      setPlanChange(null)
      await load()
    } catch {
      addToast({ type: 'error', title: 'Erro ao alterar plano.' })
    } finally {
      setMutating(false)
    }
  }

  const confirmStatusChange = async () => {
    if (!statusChange) return
    setMutating(true)
    try {
      await api.patch(`/admin/users/${statusChange.user.id}/status`, { action: statusChange.suspend ? 'suspend' : 'activate' })
      addToast({ type: 'success', title: statusChange.suspend ? 'Usuário suspenso.' : 'Usuário reativado.' })
      setStatusChange(null)
      await load()
    } catch {
      addToast({ type: 'error', title: 'Erro ao atualizar status do usuário.' })
    } finally {
      setMutating(false)
    }
  }

  const columns: AdminTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'Usuário',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0" aria-hidden="true">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-sm text-slate-900 truncate">{user.name ?? '—'}</p>
            <p className="font-sans text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plano',
      render: (user) => (
        <select
          value={user.plan}
          onChange={(e) => setPlanChange({ user, plan: e.target.value })}
          aria-label={`Alterar plano de ${user.name ?? user.email}`}
          className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-sans font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
        >
          {Object.entries(PLAN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'clients',
      header: 'Clientes',
      render: (user) => <span className="font-mono text-sm text-slate-700">{user._count.clients}</span>,
    },
    {
      key: 'createdAt',
      header: 'Cadastro',
      render: (user) => <span className="font-mono text-sm text-slate-500">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (user) => {
        const suspended = user.planStatus === 'SUSPENDED'
        return (
          <button
            onClick={() => setStatusChange({ user, suspend: !suspended })}
            className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              suspended
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            {suspended ? 'Reativar' : 'Suspender'}
          </button>
        )
      },
    },
  ]

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <PageHeader title="Usuários" description={`${total} usuários cadastrados`} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome ou email..."
            aria-label="Buscar usuários por nome ou email"
            className="w-full pl-10 pr-4 h-10 border border-slate-200/80 rounded-xl text-sm font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-400 text-slate-900 shadow-xs"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); load(search, 1, e.target.value) }}
          aria-label="Filtrar por plano"
          className="px-3 h-10 bg-white border border-slate-200/80 rounded-xl text-sm font-sans text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Todos os planos</option>
          {Object.entries(PLAN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        rowKey={(user) => user.id}
        loading={loading}
        error={error}
        onRetry={() => load()}
        emptyIcon={Users}
        emptyTitle="Nenhum usuário encontrado"
        emptyDescription="Ajuste os filtros de busca para encontrar o que procura."
      />

      <AdminPagination page={page} pages={pages} total={total} itemLabel="usuários" onChange={(p) => { setPage(p); load(search, p) }} />

      <ConfirmDialog
        open={planChange !== null}
        onConfirm={confirmPlanChange}
        onCancel={() => setPlanChange(null)}
        title="Alterar plano"
        message={planChange ? `Alterar o plano de ${planChange.user.name ?? planChange.user.email} para ${PLAN_LABELS[planChange.plan]}?` : ''}
        confirmLabel="Alterar plano"
        variant="warning"
        loading={mutating}
      />

      <ConfirmDialog
        open={statusChange !== null}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusChange(null)}
        title={statusChange?.suspend ? 'Suspender usuário' : 'Reativar usuário'}
        message={
          statusChange
            ? statusChange.suspend
              ? `Tem certeza que deseja suspender ${statusChange.user.name ?? statusChange.user.email}? O usuário perderá acesso imediato à plataforma.`
              : `Reativar o acesso de ${statusChange.user.name ?? statusChange.user.email}?`
            : ''
        }
        confirmLabel={statusChange?.suspend ? 'Suspender' : 'Reativar'}
        variant={statusChange?.suspend ? 'danger' : 'warning'}
        loading={mutating}
      />
    </div>
    </ErrorBoundary>
  )
}
