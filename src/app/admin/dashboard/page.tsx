'use client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useApi } from '@/hooks/useApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageError } from '@/components/ui/PageError'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { KpiCard } from '@/components/admin/metrics/KpiCard'
import { UsersByPlanCard } from '@/components/admin/metrics/UsersByPlanCard'
import { AiUsageCard } from '@/components/admin/metrics/AiUsageCard'
import { CasesPipelineCard } from '@/components/admin/metrics/CasesPipelineCard'
import { formatBRL, type AdminMetrics } from '@/components/admin/metrics/types'
import { TrendingUp, Users, DollarSign } from 'lucide-react'

export default function AdminDashboardPage() {
  const { data: metrics, loading, error, refetch } = useApi<AdminMetrics>('/admin/metrics')

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <PageHeader title="Dashboard Administrativo" description="Visão executiva do Previando" />

      {loading ? (
        <CardSkeleton count={4} />
      ) : error || !metrics ? (
        <PageError title="Erro ao carregar métricas" reset={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard icon={DollarSign} label="MRR" value={formatBRL(metrics.revenue.mrr)} highlight />
            <KpiCard icon={TrendingUp} label="Receita (mês)" value={formatBRL(metrics.revenue.totalThisMonth)} />
            <KpiCard icon={Users} label="Total Usuários" value={metrics.users.total} />
            <KpiCard icon={Users} label="Novos este mês" value={metrics.users.newThisMonth} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 space-y-6">
              <CasesPipelineCard metrics={metrics} />
            </div>
            <div className="xl:col-span-1 space-y-6">
              <UsersByPlanCard metrics={metrics} />
              <AiUsageCard metrics={metrics} />
            </div>
          </div>
        </>
      )}
    </div>
    </ErrorBoundary>
  )
}
