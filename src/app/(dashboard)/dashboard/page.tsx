'use client'

import { useEffect, useState, ComponentType } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  Users, Briefcase, AlertCircle, CheckCircle2, MessageSquare, FileText,
  Scale, StickyNote, Calculator, ChevronRight, Activity, Columns, TrendingUp, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

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

const STATUS_LABELS: Record<string, string> = {
  PROSPECCAO: 'Prospecção',
  ANALISE: 'Análise',
  PRONTO_PARA_REQUERER: 'Pronto p/ Requerer',
  EM_PROCESSAMENTO: 'Em Processamento',
  FINALIZADO: 'Finalizado',
}

const BENEFIT_LABELS: Record<string, string> = {
  RETIREMENT_BY_AGE: 'Idade',
  RETIREMENT_BY_CONTRIBUTION_TIME: 'Tempo',
  SPECIAL_RETIREMENT: 'Especial',
  HYBRID_RETIREMENT: 'Híbrida',
  POINTS_RETIREMENT: 'Pontos',
  SICKNESS_BENEFIT: 'Aux. Doença',
  DEATH_PENSION: 'Pensão',
  BPC_LOAS: 'BPC/LOAS',
  MATERNITY_PAY: 'Maternidade',
  ACCIDENT_BENEFIT: 'Acidente',
  PRISONER_BENEFIT: 'Reclusão',
  BENEFIT_REVIEW: 'Revisão',
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  ATTENTION: '#f59e0b',
  NORMAL: '#10b981',
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico',
  ATTENTION: 'Atenção',
  NORMAL: 'Normal',
}

const NOTE_TYPE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  CONTATO: MessageSquare,
  DOCUMENTO: FileText,
  JURIDICO: Scale,
  INTERNO: StickyNote,
  CALCULO: Calculator,
  PENDENCIA: AlertCircle,
}

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function deadlineDays(date: string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  return diff
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

  const benefitChartData = Object.entries(data?.cases.byBenefitType ?? {})
    .map(([k, v]) => ({ name: BENEFIT_LABELS[k] ?? k, count: v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const priorityChartData = Object.entries(data?.clientsByPriority ?? {}).map(([k, v]) => ({
    name: PRIORITY_LABELS[k] ?? k,
    value: v,
    color: PRIORITY_COLORS[k] ?? '#94a3b8',
  }))

  const monthChartData = (data?.cases.createdByMonth ?? []).map((m) => ({
    name: m.month.slice(5), // só MM
    casos: m.count,
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="font-sans text-sm text-slate-500 mt-1 font-medium">Acompanhamento do escritório</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/clients/list" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
            <Users className="w-4 h-4" /> Clientes
          </Link>
          <Link href="/clients/kanban" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 shadow-sm transition-all flex items-center gap-2">
            <Columns className="w-4 h-4" /> Kanban
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Users, label: 'Total de Clientes', value: data?.totalClients ?? 0, color: 'amber' },
          { icon: Briefcase, label: 'Casos Ativos', value: data?.cases.total ?? 0, color: 'amber' },
          { icon: AlertCircle, label: 'Atenção Crítica', value: data?.cases.critical ?? 0, color: 'red' },
          { icon: CheckCircle2, label: 'Finalizados', value: data?.cases.byStatus?.FINALIZADO ?? 0, color: 'green' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} variant="light" className={`p-6 flex flex-col gap-4 group hover:border-${color}-200 transition-colors`}>
            <div className={`w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center text-${color}-500`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-sans font-semibold text-3xl text-slate-900">{value}</p>
              <p className="font-sans font-medium text-sm text-slate-500 mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* RMI Metrics */}
      {(data?.calculations.total ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="light" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Cálculos Realizados</span>
            </div>
            <p className="font-serif font-bold text-2xl text-slate-900">{data?.calculations.total}</p>
          </Card>
          <Card variant="light" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">RMI Médio</span>
            </div>
            <p className="font-serif font-bold text-2xl text-slate-900">{formatCurrency(data?.calculations.avgRmi ?? 0)}</p>
          </Card>
          <Card variant="light" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">RMI Total Potencial</span>
            </div>
            <p className="font-serif font-bold text-2xl text-slate-900">{formatCurrency(data?.calculations.totalRmiPotencial ?? 0)}</p>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Casos por mês */}
        {monthChartData.length > 0 && (
          <Card variant="light" className="p-6 lg:col-span-2">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Casos por Mês</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="casos" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Clientes por prioridade */}
        {priorityChartData.length > 0 && (
          <Card variant="light" className="p-6">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Clientes por Prioridade</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={priorityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pipeline */}
        <Card variant="light" className="p-0 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-slate-900">Pipeline</h3>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-6 bg-slate-50/50">
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <div key={status} className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="font-sans font-bold text-2xl text-slate-800 mb-2">
                    {data?.cases.byStatus[status] ?? 0}
                  </div>
                  <div className="font-sans text-xs text-slate-500 text-center leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefícios */}
          {benefitChartData.length > 0 && (
            <div className="p-6 border-t border-slate-100">
              <h4 className="font-sans font-semibold text-sm text-slate-700 mb-3">Distribuição por Tipo de Benefício</h4>
              <div className="space-y-2">
                {benefitChartData.map((b) => {
                  const pct = data?.cases.total ? Math.round((b.count / data.cases.total) * 100) : 0
                  return (
                    <div key={b.name} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24 truncate">{b.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-700 font-semibold w-6 text-right">{b.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Prazos próximos */}
          {(data?.upcomingDeadlines?.length ?? 0) > 0 && (
            <Card variant="light" className="p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif font-bold text-base text-slate-900">Prazos Próximos</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {data!.upcomingDeadlines.map((d) => {
                  const days = deadlineDays(d.deadlineDate)
                  return (
                    <Link key={d.id} href={`/cases/${d.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${days <= 1 ? 'bg-red-100 text-red-600' : days <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {days}d
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{d.client.name}</p>
                        <p className="text-xs text-slate-500 truncate">{new Date(d.deadlineDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Atividade recente */}
          <Card variant="light" className="p-0 overflow-hidden flex-1">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-serif font-bold text-base text-slate-900">Atividade Recente</h3>
            </div>
            <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
              {(data?.recentNotes ?? []).length > 0 ? data!.recentNotes.map((note, idx) => {
                const Icon = NOTE_TYPE_ICON[note.type] || FileText
                return (
                  <div key={note.id} className="relative pl-6">
                    {idx < data!.recentNotes.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-slate-200" />
                    )}
                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{note.case.client.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{note.content}</p>
                  </div>
                )
              }) : (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma atividade recente</p>
              )}
            </div>
          </Card>
        </div>
      </div>

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
