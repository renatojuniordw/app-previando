'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions'
import { DashboardAttention } from '@/components/dashboard/DashboardAttention'
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DashboardPipeline } from '@/components/dashboard/DashboardPipeline'
import { DashboardDeadlines } from '@/components/dashboard/DashboardDeadlines'
import { DashboardActivityFeed } from '@/components/dashboard/DashboardActivityFeed'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner'
import { cn } from '@/lib/utils'

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
    deadlines: Array<{ id: string; deadlineDate: string; benefitType: string; client: { name: string } }>
    calendarEvents: Array<{ id: string; title: string; date: string }>
  }
  clientsByPriority: Record<string, number>
  attention: {
    prospecting: number
    withoutCalculation: number
    critical: number
  }
  recentNotes: Array<{
    id: string; type: string; content: string; createdAt: string
    case: { id: string; client: { name: string } }
  }>
}

export default function DashboardPage() {
  useEffect(() => { document.title = 'Dashboard — Previando' }, [])
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const hasDataRef = useRef(false)
  const { addToast } = useToast()

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const r = await api.get('/dashboard/summary')
      setData(r.data)
      hasDataRef.current = true
      setError(false)
    } catch {
      if (!hasDataRef.current) setError(true)
      addToast({ type: 'error', title: 'Erro ao carregar dashboard' })
    } finally {
      setLoading(false)
      if (isRefresh) setRefreshing(false)
    }
  }, [addToast])

  useEffect(() => { fetchData() }, [fetchData])

  // Polling a cada 60s para revalidação automática
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Visão Geral</h1>
            <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">Acompanhamento do escritório</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => fetchData(true)}
            disabled={loading || refreshing}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50',
              refreshing && 'opacity-50 cursor-wait'
            )}
            aria-label="Atualizar dados"
            title="Atualizar dados"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
          <DashboardQuickActions />
        </div>
      </div>

      {/* Estado de erro — separado do empty state */}
      {error && !data && (
        <div className="text-center py-16 bg-white border border-red-200 rounded-xl shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">Erro ao carregar</h3>
          <p className="font-sans text-slate-500 mb-6 max-w-md mx-auto">
            Não foi possível carregar os dados do dashboard. Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={() => { setLoading(true); setError(false); fetchData() }}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-6 min-h-[44px] border-2 border-amber-600 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading state — só skeletons, sem spinner central */}
      {loading && !data && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse lg:col-span-2" />
            <div className="space-y-6">
              <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </>
      )}

      {/* Onboarding — só para usuários sem clientes */}
      {data?.totalClients === 0 && !error && <OnboardingBanner />}

      {/* Precisa de atenção — casos pendentes */}
      {data && !error && data.totalClients > 0 && (
        <DashboardAttention data={data.attention} />
      )}

      <ErrorBoundary>
        {/* KPIs + RMI Metrics */}
        {kpiData && !error && <DashboardKpiGrid data={kpiData} />}

        {/* Charts Row */}
        {data && !error && (
          <DashboardCharts
            data={{
              createdByMonth: data.cases.createdByMonth ?? [],
              byPriority: data.clientsByPriority ?? {},
            }}
          />
        )}

        {/* Bottom Row */}
        {data && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardPipeline
              data={{
                byStatus: data.cases.byStatus ?? {},
                total: data.cases.total ?? 0,
                byBenefitType: benefitChartData,
              }}
            />

            <div className="space-y-6">
              <DashboardDeadlines events={data.upcomingEvents ?? { deadlines: [], calendarEvents: [] }} />
              <DashboardActivityFeed notes={data.recentNotes ?? []} />
            </div>
          </div>
        )}

      </ErrorBoundary>
    </div>
  )
}
