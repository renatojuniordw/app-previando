import { BarChart3 } from 'lucide-react'
import { AdminCard } from '@/components/admin/AdminCard'
import { ProportionRow } from './ProportionRow'
import { STATUS_LABELS } from '@/lib/constants'
import type { AdminMetrics } from './types'

export function CasesPipelineCard({ metrics }: { metrics: AdminMetrics }) {
  return (
    <AdminCard
      icon={BarChart3}
      title="Pipeline de Casos"
      badge={
        <span className="font-sans text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md whitespace-nowrap">
          {metrics.cases.total} casos
        </span>
      }
    >
      <div className="space-y-4">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <ProportionRow
            key={status}
            label={label}
            value={metrics.cases.byStatus[status] ?? 0}
            total={metrics.cases.total}
            colorClass="bg-slate-400"
          />
        ))}
      </div>
    </AdminCard>
  )
}
