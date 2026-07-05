import { Users } from 'lucide-react'
import { AdminCard } from '@/components/admin/AdminCard'
import { ProportionRow } from './ProportionRow'
import { PLAN_LABELS, type AdminMetrics } from './types'

interface UsersByPlanCardProps {
  metrics: AdminMetrics
  showTotals?: boolean
}

export function UsersByPlanCard({ metrics, showTotals }: UsersByPlanCardProps) {
  const plans = Array.from(new Set([...Object.keys(PLAN_LABELS), ...Object.keys(metrics.users.byPlan)]))

  return (
    <AdminCard icon={Users} title="Usuários por Plano">
      <div className="space-y-4">
        {showTotals && (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-sans text-sm text-slate-500 font-medium">Total</span>
              <span className="font-mono font-bold text-xl text-slate-900">{metrics.users.total}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-sans text-sm text-slate-500 font-medium">Novos este mês</span>
              <span className="font-mono font-bold text-lg text-amber-600">{metrics.users.newThisMonth}</span>
            </div>
          </>
        )}
        {plans.map((plan) => (
          <ProportionRow key={plan} label={PLAN_LABELS[plan] ?? plan} value={metrics.users.byPlan[plan] ?? 0} total={metrics.users.total} />
        ))}
      </div>
    </AdminCard>
  )
}
