'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Users, ChevronRight, LayoutDashboard } from 'lucide-react'
import dynamic from 'next/dynamic'
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner'

const DashboardKpiGrid = dynamic(() => import('@/components/dashboard/DashboardKpiGrid').then((m) => ({ default: m.DashboardKpiGrid })), {
  loading: () => <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>,
})

const DashboardCharts = dynamic(() => import('@/components/dashboard/DashboardCharts').then((m) => ({ default: m.DashboardCharts })), {
  loading: () => <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />,
})

const DashboardPipeline = dynamic(() => import('@/components/dashboard/DashboardPipeline').then((m) => ({ default: m.DashboardPipeline })), {
  loading: () => <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />,
})

const DashboardDeadlines = dynamic(() => import('@/components/dashboard/DashboardDeadlines').then((m) => ({ default: m.DashboardDeadlines })), {
  loading: () => <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />,
})

const DashboardActivityFeed = dynamic(() => import('@/components/dashboard/DashboardActivityFeed').then((m) => ({ default: m.DashboardActivityFeed })), {
  loading: () => <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />,
})

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
  upcomingEvents: {
    deadlines: Array<{ id: string; deadlineDate: string; client: { name: string } }>
    calendarEvents: Array<{ id: string; title: string; date: string }>
  }
  clientsByPriority: Record<string, number>
  recentNotes: Array<{
    id: string; type: string; content: string; createdAt: string
    case: { id: string; client: { name: string } }
  }>
}

export default function DashboardPage() {
  useEffect(() => { document.title = 'Dashboard — Previando' }, [])
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((r) => setData(r.data))
      .catch(() => {
        addToast({ type: 'error', title: 'Erro ao carregar dashboard' })
      })
      .finally(() => setLoading(false))
  }, [addToast])

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Visão Geral</h1>
            <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">Acompanhamento do escritório</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <DashboardQuickActions />
        </div>
      </div>

      {/* Onboarding — só para usuários sem clientes */}
      {!loading && data?.totalClients === 0 && <OnboardingBanner />}

      <ErrorBoundary>
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
          <DashboardDeadlines events={data?.upcomingEvents ?? { deadlines: [], calendarEvents: [] }} />

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
          <Link href="/clients/list" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 cursor-pointer select-none shadow-sm">
            Cadastrar Cliente <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
      </ErrorBoundary>
    </div>
  )
}
