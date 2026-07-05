import { Cpu, Calculator, FileText } from 'lucide-react'
import { AdminCard } from '@/components/admin/AdminCard'
import type { AdminMetrics } from './types'

export function AiUsageCard({ metrics }: { metrics: AdminMetrics }) {
  return (
    <AdminCard icon={Cpu} title="Uso de IA">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <Calculator className="w-4 h-4" aria-hidden="true" />
            <span className="font-sans text-sm font-medium">Cálculos</span>
          </div>
          <span className="font-mono font-bold text-slate-900">{metrics.usage.totalCalculations}</span>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span className="font-sans text-sm font-medium">Pareceres</span>
          </div>
          <span className="font-mono font-bold text-slate-900">{metrics.usage.totalOpinions}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-sans text-sm font-medium text-slate-500">Custo IA este mês</span>
          <span className={`font-mono font-bold ${metrics.usage.aiCostThisMonthUsd > 10 ? 'text-amber-600' : 'text-slate-900'}`}>
            ${metrics.usage.aiCostThisMonthUsd.toFixed(2)}
          </span>
        </div>
      </div>
    </AdminCard>
  )
}
