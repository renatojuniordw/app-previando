'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { STATUS_LABELS } from '@/lib/constants'
import { TrendingUp, DollarSign, Users, Cpu, BarChart3 } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
          <p className="font-sans text-sm text-slate-500 animate-pulse">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center">
        <p className="font-sans text-sm text-red-500">Erro ao carregar métricas.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="font-serif font-bold text-2xl text-slate-900">Métricas Detalhadas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <Card variant="light" className="p-6">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg text-slate-900">Receita</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">MRR</span>
              <span className="font-bold text-xl text-amber-600">{formatBRL(metrics.revenue.mrr)}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Este mês</span>
              <span className="font-bold text-lg text-slate-900">{formatBRL(metrics.revenue.totalThisMonth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Total (all time)</span>
              <span className="font-bold text-lg text-slate-900">{formatBRL(metrics.revenue.totalAllTime)}</span>
            </div>
          </div>
        </Card>

        {/* Users */}
        <Card variant="light" className="p-6">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <Users className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg text-slate-900">Usuários</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Total</span>
              <span className="font-bold text-xl text-slate-900">{metrics.users.total}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Novos este mês</span>
              <span className="font-bold text-lg text-amber-600">{metrics.users.newThisMonth}</span>
            </div>
            <div className="space-y-2">
              {['FREE', 'SOLO', 'PRO'].map((plan) => (
                <div key={plan} className="flex items-center justify-between text-sm">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{plan}</span>
                  <span className="font-semibold text-slate-700">{metrics.users.byPlan[plan] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* AI Usage */}
        <Card variant="light" className="p-6">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <Cpu className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg text-slate-900">Uso de IA</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Cálculos (total)</span>
              <span className="font-bold text-lg text-slate-900">{metrics.usage.totalCalculations}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Pareceres (total)</span>
              <span className="font-bold text-lg text-slate-900">{metrics.usage.totalOpinions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Custo IA este mês</span>
              <span className={`font-bold text-lg ${metrics.usage.aiCostThisMonthUsd > 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                ${metrics.usage.aiCostThisMonthUsd.toFixed(4)}
              </span>
            </div>
          </div>
        </Card>

        {/* Cases Pipeline */}
        <Card variant="light" className="p-6">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg text-slate-900">Pipeline de Casos</h3>
          </div>
          <p className="font-bold text-3xl text-slate-900 mb-4">{metrics.cases.total}</p>
          <div className="space-y-2">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-700">{metrics.cases.byStatus[status] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
