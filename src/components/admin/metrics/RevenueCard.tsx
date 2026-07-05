import { DollarSign } from 'lucide-react'
import { AdminCard } from '@/components/admin/AdminCard'
import { formatBRL, type AdminMetrics } from './types'

export function RevenueCard({ metrics }: { metrics: AdminMetrics }) {
  return (
    <AdminCard icon={DollarSign} title="Receita">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="font-sans text-sm text-slate-500 font-medium">MRR</span>
          <span className="font-mono font-bold text-xl text-amber-600">{formatBRL(metrics.revenue.mrr)}</span>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="font-sans text-sm text-slate-500 font-medium">Este mês</span>
          <span className="font-mono font-bold text-lg text-slate-900">{formatBRL(metrics.revenue.totalThisMonth)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-sans text-sm text-slate-500 font-medium">Total (all time)</span>
          <span className="font-mono font-bold text-lg text-slate-900">{formatBRL(metrics.revenue.totalAllTime)}</span>
        </div>
      </div>
    </AdminCard>
  )
}
