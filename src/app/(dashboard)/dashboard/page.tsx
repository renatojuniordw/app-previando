'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Users, ChevronRight, Columns } from 'lucide-react'
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DashboardPipeline } from '@/components/dashboard/DashboardPipeline'
import { DashboardDeadlines } from '@/components/dashboard/DashboardDeadlines'
import { DashboardActivityFeed } from '@/components/dashboard/DashboardActivityFeed'

interface DashboardData {
  totalClients: number
  cases: {
    total: number
    byStatus: Record<string, number>
    critical: number
    byBenefitType: Record<string, number>
    createdByMonth: Array<{ month: string; count: number }>
  }
  calculations: { total: number; avgRmi: number; totalRmiPotencial: number }
  upcomingDeadlines: Array<{
    id: string
    deadlineDate: string
    benefitType: string
    client: { name: string }
  }>
  clientsByPriority: Record<string, number>
  recentNotes: Array<{
    id: string; type: string; content: string; createdAt: string
    case: { id: string; client: { name: string } }
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((r) => setData(r.data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full"></div>
          <p className="font-sans font-medium text-slate-500 animate-pulse">Carregando painel...</p>
        </div>
      </div>
    )
  }

  const kpiData = data ? {
    totalClients: data.totalClients,
    totalCases: data.cases.total,
    critical: data.cases.critical,
    finalized: data.cases.byStatus?.FINALIZADO ?? 0,
    calculationsTotal: data.calculations.total,
    avgRmi: data.calculations.avgRmi,
    totalRmiPotencial: data.calculations.totalRmiPotencial,
  } : null

  const benefitChartData = data
    ? Object.entries(data.cases.byBenefitType)
        .map(([k, v]) => ({ name: k, count: v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : []

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="font-sans text-sm text-slate-500 mt-1 font-medium">Acompanhamento do escritório</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/clients/list"
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Clientes
          </Link>
          <Link
            href="/clients/kanban"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 shadow-sm transition-all flex items-center gap-2"
          >
            <Columns className="w-4 h-4" /> Kanban
          </Link>
        </div>
      </div>

      {/* KPIs + RMI Metrics */}
      {kpiData && <DashboardKpiGrid data={kpiData} />}

      {/* Charts Row */}
      <DashboardCharts
        data={{
          createdByMonth: data?.cases.createdByMonth ?? [],
          byPriority: data?.clientsByPriority ?? {},
        }}
      />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <DashboardPipeline
          data={{
            byStatus: data?.cases.byStatus ?? {},
            total: data?.cases.total ?? 0,
            byBenefitType: benefitChartData,
          }}
        />

        {/* Right Column */}
        <div className="space-y-6">
          {/* Prazos próximos */}
          <DashboardDeadlines deadlines={data?.upcomingDeadlines ?? []} />

          {/* Atividade recente */}
          <DashboardActivityFeed notes={data?.recentNotes ?? []} />
        </div>
      </div>

      {/* Empty state */}
      {!data && !loading && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Users className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">Bem-vindo ao Previando</h3>
          <p className="font-sans text-slate-500 mb-6 max-w-md mx-auto">
            Cadastre seu primeiro cliente para começar.
          </p>
          <Link href="/clients/list" className="neo-btn inline-flex items-center gap-2">
            Cadastrar Cliente <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
