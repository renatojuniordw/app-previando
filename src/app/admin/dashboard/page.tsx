'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { TrendingUp, Users, DollarSign, Calculator, FileText, Cpu } from 'lucide-react'

interface Metrics {
  users: { total: number; byPlan: Record<string, number>; newThisMonth: number }
  revenue: { mrr: number; totalThisMonth: number; totalAllTime: number }
  usage: { totalCalculations: number; totalOpinions: number; aiCostThisMonthUsd: number }
  cases: { total: number; byStatus: Record<string, number> }
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AdminDashboardPage() {
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

  const KPI_CARDS = [
    { icon: DollarSign, label: 'MRR', value: formatBRL(metrics.revenue.mrr), highlight: true },
    { icon: TrendingUp, label: 'Receita (mês)', value: formatBRL(metrics.revenue.totalThisMonth) },
    { icon: Users, label: 'Total Usuários', value: metrics.users.total },
    { icon: Users, label: 'Novos este mês', value: metrics.users.newThisMonth },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="font-serif font-bold text-2xl text-slate-900">Dashboard Administrativo</h1>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI_CARDS.map(({ icon: Icon, label, value, highlight }) => (
          <Card key={label} variant="light" className="p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className={`font-bold text-2xl ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>
              {value}
            </p>
          </Card>
        ))}
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Plan */}
        <Card variant="light" className="p-6">
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Usuários por Plano</h3>
          <div className="space-y-3">
            {['FREE', 'SOLO', 'PRO'].map((plan) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    {plan}
                  </span>
                </div>
                <span className="font-bold text-lg text-slate-900">{metrics.users.byPlan[plan] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Usage */}
        <Card variant="light" className="p-6">
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Uso de IA</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-medium">Cálculos</span>
              </div>
              <span className="font-bold text-slate-900">{metrics.usage.totalCalculations}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Pareceres</span>
              </div>
              <span className="font-bold text-slate-900">{metrics.usage.totalOpinions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Cpu className="w-4 h-4" />
                <span className="text-sm font-medium">Custo IA/mês</span>
              </div>
              <span className="font-bold text-amber-600">${metrics.usage.aiCostThisMonthUsd.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Cases Pipeline */}
        <Card variant="light" className="p-6">
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Casos</h3>
          <p className="font-bold text-3xl text-slate-900 mb-4">{metrics.cases.total}</p>
          <div className="space-y-2">
            {Object.entries(metrics.cases.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-500 capitalize">{status.toLowerCase()}</span>
                <span className="font-semibold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
