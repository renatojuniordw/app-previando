'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Loader2, BarChart3, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { ReportKpiCard, ReportPeriodSelector } from '@/components/reports'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const ReportBarChart = dynamic(() => import('@/components/reports').then(m => m.ReportBarChart), {
  loading: () => <div className="h-[300px] bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />,
})

const ReportPieChart = dynamic(() => import('@/components/reports').then(m => m.ReportPieChart), {
  loading: () => <div className="h-[300px] bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />,
})

const ReportHorizontalBar = dynamic(() => import('@/components/reports').then(m => m.ReportHorizontalBar), {
  loading: () => <div className="h-[260px] bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />,
})

const ConversionFunnel = dynamic(() => import('@/components/reports').then(m => m.ConversionFunnel), {
  loading: () => <div className="h-[300px] bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />,
})

import type { PeriodOption } from '@/components/reports'
import { STATUS_LABELS } from '@/lib/constants'

interface OverviewData {
  totalClients: number
  totalCases: number
  totalCalculations: number
  avgRmi: number
  totalFeesExpected: number
  totalFeesReceived: number
  totalFeesPending: number
}

interface FinanceiroData {
  feesByMonth: Array<{ month: string; expected: number; realized: number }>
  potentialRevenue: number
  averageTicket: number
  conversionRate: number
  totalFeesExpected: number
  totalFeesReceived: number
}

interface OperacionalData {
  casesByPhase: Record<string, number>
  avgDaysPerPhase: Record<string, number>
  distributionByBenefitType: Record<string, number>
  casesCreatedByMonth: Array<{ month: string; count: number }>
}

function formatNumber(val: number) {
  return val.toLocaleString('pt-BR')
}

export default function ReportsPage() {
  useEffect(() => { document.title = 'Relatórios — Previando' }, [])
  const [period, setPeriod] = useState<PeriodOption>(90)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [financeiro, setFinanceiro] = useState<FinanceiroData | null>(null)
  const [operacional, setOperacional] = useState<OperacionalData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (days: PeriodOption) => {
    setLoading(true)
    try {
      const [overviewRes, financeiroRes, operacionalRes] = await Promise.all([
        api.get('/reports/overview').catch(() => ({ data: null })),
        api.get(`/reports/financeiro?days=${days}`).catch(() => ({ data: null })),
        api.get(`/reports/operacional?days=${days}`).catch(() => ({ data: null })),
      ])

      if (overviewRes.data) setOverview(overviewRes.data)
      if (financeiroRes.data) setFinanceiro(financeiroRes.data)
      if (operacionalRes.data) setOperacional(operacionalRes.data)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll(period)
  }, [period, fetchAll])

  if (loading && !overview) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100dvh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="font-sans font-medium text-slate-500 animate-pulse">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 lg:space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
              <Link href="/dashboard" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
              </Link>
            </div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Relatórios Gerenciais</h1>
            <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">
              Métricas detalhadas de performance e saúde financeira do escritório.
            </p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm self-start sm:self-center">
          <ReportPeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* KPI Cards */}
      <section className="space-y-4">
        <h2 className="font-serif font-bold text-lg text-slate-800 tracking-wide">
          Indicadores de Performance (KPIs)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ReportKpiCard
            label="Total de Clientes"
            value={formatNumber(overview?.totalClients ?? 0)}
            icon="users"
            color="amber"
          />
          <ReportKpiCard
            label="Casos Ativos"
            value={formatNumber(overview?.totalCases ?? 0)}
            icon="briefcase"
            color="blue"
          />
          <ReportKpiCard
            label="Cálculos Realizados"
            value={formatNumber(overview?.totalCalculations ?? 0)}
            icon="calculator"
            color="amber"
          />
          <ReportKpiCard
            label="RMI Médio"
            value={formatCurrency(overview?.avgRmi ?? 0)}
            icon="trending"
            color="green"
          />
          <ReportKpiCard
            label="Honorários Previstos"
            value={formatCurrency(overview?.totalFeesExpected ?? 0)}
            icon="dollar"
            color="amber"
          />
          <ReportKpiCard
            label="Honorários Recebidos"
            value={formatCurrency(overview?.totalFeesReceived ?? 0)}
            icon="dollar"
            color="green"
          />
          <ReportKpiCard
            label="Ticket Médio"
            value={formatCurrency(financeiro?.averageTicket ?? 0)}
            icon="trending"
            color="blue"
          />
          <ReportKpiCard
            label="Taxa de Conversão"
            value={`${financeiro?.conversionRate ?? 0}%`}
            icon="trending"
            color="amber"
          />
        </div>
      </section>

      {/* Casos por Mês + Distribuição */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReportBarChart
            title="Casos Criados por Mês"
            data={operacional?.casesCreatedByMonth ?? []}
            categories={[
              { key: 'count', name: 'Casos', color: '#d97706' },
            ]}
          />
        </div>
        <ReportPieChart
          title="Distribuição por Tipo de Benefício"
          data={
            operacional?.distributionByBenefitType
              ? Object.entries(operacional.distributionByBenefitType).map(
                  ([k, v]) => ({ name: k, value: v })
                )
              : []
          }
          donut
          useBenefitLabels
        />
      </section>

      {/* Honorários + Funil + Tempo médio */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {financeiro?.feesByMonth && financeiro.feesByMonth.length > 0 && (
            <ReportBarChart
              title="Honorários: Previsto vs. Realizado por Mês"
              data={financeiro.feesByMonth}
              categories={[
                {
                  key: 'expected',
                  name: 'Previsto',
                  color: '#94a3b8',
                  type: 'bar',
                },
                {
                  key: 'realized',
                  name: 'Realizado',
                  color: '#d97706',
                  type: 'bar',
                },
              ]}
            />
          )}
        </div>
        <ConversionFunnel
          data={operacional?.casesByPhase ?? {}}
        />
      </section>

      {/* Tempo médio por fase + Métricas Financeiras */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportHorizontalBar
          title="Tempo Médio por Fase (dias)"
          data={
            operacional?.avgDaysPerPhase
              ? Object.entries(operacional.avgDaysPerPhase).map(
                  ([k, v]) => ({
                    name: STATUS_LABELS[k] ?? k,
                    value: v,
                  })
                )
              : []
          }
        />

        <Card variant="light" className="p-6 border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Resumo Financeiro
            </h3>
            <div className="space-y-1.5 text-sm font-sans">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  Receita Potencial (estimada)
                </span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  {formatCurrency(financeiro?.potentialRevenue ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  Total de Honorários Previstos
                </span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  {formatCurrency(financeiro?.totalFeesExpected ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  Total de Honorários Recebidos
                </span>
                <span className="font-mono font-bold text-sm text-emerald-700">
                  {formatCurrency(financeiro?.totalFeesReceived ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  Ticket Médio por Honorário
                </span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  {formatCurrency(financeiro?.averageTicket ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Rodapé com data da última atualização */}
      <p className="text-center font-sans font-medium text-[10px] text-slate-400 pb-6 uppercase tracking-wider">
        Os dados são atualizados automaticamente a cada 5 minutos. Período selecionado: {period} dias.
      </p>
    </div>
  )
}
