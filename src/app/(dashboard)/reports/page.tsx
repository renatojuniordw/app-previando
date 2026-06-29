'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Loader2, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  ReportKpiCard,
  ReportBarChart,
  ReportPieChart,
  ReportHorizontalBar,
  ReportPeriodSelector,
  ConversionFunnel,
} from '@/components/reports'
import type { PeriodOption } from '@/components/reports'
import { STATUS_LABELS } from '@/lib/constants'

// ── Types ──────────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────
function formatNumber(val: number) {
  return val.toLocaleString('pt-BR')
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodOption>(90)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [financeiro, setFinanceiro] = useState<FinanceiroData | null>(null)
  const [operacional, setOperacional] = useState<OperacionalData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (days: PeriodOption) => {
    setLoading(true)
    try {
      const [overviewRes, financeiroRes, operacionalRes] = await Promise.all([
        fetch('/api/reports/overview'),
        fetch(`/api/reports/financeiro?days=${days}`),
        fetch(`/api/reports/operacional?days=${days}`),
      ])

      if (overviewRes.ok) setOverview(await overviewRes.json())
      if (financeiroRes.ok) setFinanceiro(await financeiroRes.json())
      if (operacionalRes.ok) setOperacional(await operacionalRes.json())
    } catch {
      // Silently fail — data stays null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll(period)
  }, [period, fetchAll])

  if (loading && !overview) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="font-sans font-medium text-slate-500 animate-pulse">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900">
            Relatórios Gerenciais
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Métricas e indicadores de desempenho do escritório
          </p>
        </div>
        <ReportPeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <h2 className="font-sans font-semibold text-lg text-slate-900">
            Indicadores de Performance (KPIs)
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            color="purple"
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
            color="purple"
          />
        </div>
      </section>

      {/* ── Casos por Mês + Distribuição ───────────────────────────────── */}
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

      {/* ── Honorários + Funil + Tempo médio ───────────────────────────── */}
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

      {/* ── Tempo médio por fase + Métricas Financeiras ────────────────── */}
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

        <Card variant="light" className="p-6">
          <CardHeader
            title="Resumo Financeiro"
            subtitle="Métricas consolidadas de honorários"
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="font-sans text-sm text-slate-600">
                Receita Potencial (honorários estimados)
              </span>
              <span className="font-sans font-semibold text-sm text-slate-900">
                {formatCurrency(financeiro?.potentialRevenue ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="font-sans text-sm text-slate-600">
                Total de Honorários Previstos
              </span>
              <span className="font-sans font-semibold text-sm text-slate-900">
                {formatCurrency(financeiro?.totalFeesExpected ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="font-sans text-sm text-slate-600">
                Total de Honorários Recebidos
              </span>
              <span className="font-sans font-semibold text-sm text-green-600">
                {formatCurrency(financeiro?.totalFeesReceived ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-sans text-sm text-slate-600">
                Ticket Médio por Honorário
              </span>
              <span className="font-sans font-semibold text-sm text-slate-900">
                {formatCurrency(financeiro?.averageTicket ?? 0)}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Rodapé com data da última atualização ──────────────────────── */}
      <p className="text-center text-xs text-slate-400 pb-8">
        Os dados são atualizados automaticamente a cada 5 minutos.
        Período selecionado: {period} dias.
      </p>
    </div>
  )
}
