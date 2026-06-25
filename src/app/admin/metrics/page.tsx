'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { STATUS_LABELS } from '@/lib/constants'

interface Metrics {
  users: { total: number; byPlan: Record<string, number>; newThisMonth: number }
  revenue: { mrr: number; totalThisMonth: number; totalAllTime: number }
  usage: { totalCalculations: number; totalOpinions: number; aiCostThisMonthUsd: number }
  cases: { total: number; byStatus: Record<string, number> }
}
function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <div className="p-8 font-mono text-slate-400 animate-pulse">Carregando...</div>
  if (!metrics) return <div className="p-8 font-mono text-red-400">Erro ao carregar métricas.</div>
  return (
    <div className="p-6 space-y-6">
      <h1 className="font-mono font-black text-2xl text-white uppercase">MÉTRICAS</h1>
      <div className="grid grid-cols-2 gap-6">
        <Card variant="dark">
          <p className="font-mono font-black text-xs uppercase tracking-widest text-slate-400 mb-4">RECEITA</p>
          <div className="space-y-3">
            {[
              { label: 'MRR', value: formatBRL(metrics.revenue.mrr), highlight: true },
              { label: 'Este mês', value: formatBRL(metrics.revenue.totalThisMonth) },
              { label: 'Total (all time)', value: formatBRL(metrics.revenue.totalAllTime) },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between font-mono text-sm">
                <span className="text-slate-400">{label}</span>
                <span className={highlight ? 'text-[#ccff00] font-black' : 'text-white font-bold'}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card variant="dark">
          <p className="font-mono font-black text-xs uppercase tracking-widest text-slate-400 mb-4">USUÁRIOS</p>
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-sm">
              <span className="text-slate-400">Total</span>
              <span className="text-white font-bold">{metrics.users.total}</span>
            </div>
            <div className="flex justify-between font-mono text-sm">
              <span className="text-slate-400">Novos este mês</span>
              <span className="text-[#ccff00] font-bold">{metrics.users.newThisMonth}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
              {['FREE', 'SOLO', 'PRO'].map((plan) => (
                <div key={plan} className="flex justify-between font-mono text-xs">
                  <span className="text-slate-500">{plan}</span>
                  <span className="text-slate-300">{metrics.users.byPlan[plan] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card variant="dark">
          <p className="font-mono font-black text-xs uppercase tracking-widest text-slate-400 mb-4">USO DE IA</p>
          <div className="space-y-3">
            {[
              { label: 'Cálculos (total)', value: String(metrics.usage.totalCalculations) },
              { label: 'Pareceres (total)', value: String(metrics.usage.totalOpinions) },
              { label: 'Custo IA este mês', value: `$${metrics.usage.aiCostThisMonthUsd.toFixed(4)}`, warning: metrics.usage.aiCostThisMonthUsd > 10 },
            ].map(({ label, value, warning }) => (
              <div key={label} className="flex justify-between font-mono text-sm">
                <span className="text-slate-400">{label}</span>
                <span className={warning ? 'text-amber-400 font-bold' : 'text-white font-bold'}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card variant="dark">
          <p className="font-mono font-black text-xs uppercase tracking-widest text-slate-400 mb-4">PIPELINE DE CASOS</p>
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-sm mb-2">
              <span className="text-slate-400">Total</span>
              <span className="text-white font-bold">{metrics.cases.total}</span>
            </div>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex justify-between font-mono text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300">{metrics.cases.byStatus[status] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
