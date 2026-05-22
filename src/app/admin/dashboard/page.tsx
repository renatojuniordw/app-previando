'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

interface Metrics {
  users: { total: number; byPlan: Record<string, number>; newThisMonth: number }
  revenue: { mrr: number; totalThisMonth: number; totalAllTime: number }
  usage: { totalCalculations: number; totalOpinions: number; aiCostThisMonthUsd: number }
  cases: { total: number; byStatus: Record<string, number> }
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/metrics', { headers: { 'x-admin-secret': ADMIN_SECRET } })
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8 font-mono text-slate-400 animate-pulse">Carregando...</div>
  }

  if (!metrics) {
    return <div className="p-8 font-mono text-red-400">Erro ao carregar métricas. Verifique o header x-admin-secret.</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-mono font-black text-2xl text-white uppercase">ADMIN — DASHBOARD</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card variant="dark">
          <p className="font-mono text-xs text-slate-400 uppercase mb-1">MRR</p>
          <p className="font-mono font-black text-2xl text-[#ccff00]">{formatBRL(metrics.revenue.mrr)}</p>
        </Card>
        <Card variant="dark">
          <p className="font-mono text-xs text-slate-400 uppercase mb-1">Receita (mês)</p>
          <p className="font-mono font-black text-2xl text-white">{formatBRL(metrics.revenue.totalThisMonth)}</p>
        </Card>
        <Card variant="dark">
          <p className="font-mono text-xs text-slate-400 uppercase mb-1">Total Usuários</p>
          <p className="font-mono font-black text-2xl text-white">{metrics.users.total}</p>
        </Card>
        <Card variant="dark">
          <p className="font-mono text-xs text-slate-400 uppercase mb-1">Novos este mês</p>
          <p className="font-mono font-black text-2xl text-white">{metrics.users.newThisMonth}</p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card variant="dark">
          <p className="font-mono text-xs text-slate-400 uppercase mb-3">Usuários por Plano</p>
          {['FREE', 'SOLO', 'PRO'].map((plan) => (
            <div key={plan} className="flex justify-between font-mono text-sm mb-1">
              <span className="text-slate-400">{plan}</span>
              <span className="text-white font-bold">{metrics.users.byPlan[plan] ?? 0}</span>
            </div>
          ))}
        </Card>
        <Card variant="dark">
          <p className="font-mono text-xs text-slate-400 uppercase mb-3">Uso IA</p>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Cálculos</span>
              <span className="text-white font-bold">{metrics.usage.totalCalculations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pareceres</span>
              <span className="text-white font-bold">{metrics.usage.totalOpinions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Custo IA/mês</span>
              <span className="text-amber-400 font-bold">${metrics.usage.aiCostThisMonthUsd.toFixed(2)}</span>
            </div>
          </div>
        </Card>
        <Card variant="dark">
          <p className="font-mono text-xs text-slate-400 uppercase mb-1">Casos</p>
          <p className="font-mono font-black text-2xl text-white mb-2">{metrics.cases.total}</p>
          {Object.entries(metrics.cases.byStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between font-mono text-xs mb-0.5">
              <span className="text-slate-500 uppercase">{status}</span>
              <span className="text-slate-300">{count}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
