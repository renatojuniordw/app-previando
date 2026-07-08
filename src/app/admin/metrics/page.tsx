'use client'
import { useApi } from '@/hooks/useApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageError } from '@/components/ui/PageError'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { RevenueCard } from '@/components/admin/metrics/RevenueCard'
import { UsersByPlanCard } from '@/components/admin/metrics/UsersByPlanCard'
import { AiUsageCard } from '@/components/admin/metrics/AiUsageCard'
import { CasesPipelineCard } from '@/components/admin/metrics/CasesPipelineCard'
import { ConversionFunnelCard } from '@/components/admin/metrics/ConversionFunnelCard'
import type { AdminMetrics } from '@/components/admin/metrics/types'

export default function AdminMetricsPage() {
  const { data: metrics, loading, error, refetch } = useApi<AdminMetrics>('/admin/metrics')

  return (
    <div className="space-y-6">
      <PageHeader title="Métricas Detalhadas" description="Receita, usuários, uso de IA e pipeline de casos" />

      {loading ? (
        <CardSkeleton count={4} />
      ) : error || !metrics ? (
        <PageError title="Erro ao carregar métricas" reset={refetch} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueCard metrics={metrics} />
          <UsersByPlanCard metrics={metrics} showTotals />
          <AiUsageCard metrics={metrics} />
          <CasesPipelineCard metrics={metrics} />
          <div className="lg:col-span-2">
            <ConversionFunnelCard />
          </div>
        </div>
      )}
    </div>
  )
}
