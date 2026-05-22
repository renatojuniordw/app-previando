'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Users, Briefcase, AlertCircle, CheckCircle2, MessageSquare, FileText, Scale, StickyNote, Calculator, ChevronRight, Activity, Columns } from 'lucide-react'

interface DashboardData {
  totalClients: number
  cases: { total: number; byStatus: Record<string, number>; critical: number }
  recentNotes: Array<{
    id: string
    type: string
    content: string
    createdAt: string
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

const NOTE_TYPE_ICON: Record<string, any> = {
  CONTATO: MessageSquare,
  DOCUMENTO: FileText,
  JURIDICO: Scale,
  INTERNO: StickyNote,
  CALCULO: Calculator,
  PENDENCIA: AlertCircle,
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">
            Visão Geral
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1 font-medium">
            Acompanhamento do escritório
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/clients/list" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </Link>
          <Link href="/clients/kanban" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 shadow-sm transition-all flex items-center gap-2">
            <Columns className="w-4 h-4" />
            Kanban
          </Link>
        </div>
      </div>

      {/* Bento Grid - Top Row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="light" className="p-6 flex flex-col gap-4 group hover:border-amber-200 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-sans font-semibold text-3xl text-slate-900">{data?.totalClients ?? 0}</p>
            <p className="font-sans font-medium text-sm text-slate-500 mt-1">Total de Clientes</p>
          </div>
        </Card>

        <Card variant="light" className="p-6 flex flex-col gap-4 group hover:border-amber-200 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-sans font-semibold text-3xl text-slate-900">{data?.cases.total ?? 0}</p>
            <p className="font-sans font-medium text-sm text-slate-500 mt-1">Casos Ativos</p>
          </div>
        </Card>

        <Card variant="light" className="p-6 flex flex-col gap-4 group hover:border-red-200 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-sans font-semibold text-3xl text-slate-900">{data?.cases.critical ?? 0}</p>
            <p className="font-sans font-medium text-sm text-slate-500 mt-1">Atenção Crítica</p>
          </div>
        </Card>

        <Card variant="light" className="p-6 flex flex-col gap-4 group hover:border-green-200 transition-colors">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-sans font-semibold text-3xl text-slate-900">{data?.cases.byStatus?.FINALIZADO ?? 0}</p>
            <p className="font-sans font-medium text-sm text-slate-500 mt-1">Casos Finalizados</p>
          </div>
        </Card>
      </div>

      {/* Bento Grid - Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Pipeline (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {data?.cases.byStatus && (
            <Card variant="light" className="p-0 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Pipeline de Produção</h3>
                  <p className="font-sans text-sm text-slate-500 mt-1">Acompanhamento dos estágios dos casos</p>
                </div>
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              <div className="p-6 bg-slate-50/50 flex-1 flex items-center">
                <div className="grid grid-cols-5 w-full gap-4">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => {
                    const count = data.cases.byStatus[status] ?? 0;
                    return (
                      <div key={status} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="font-sans font-bold text-2xl text-slate-800 mb-2">
                          {count}
                        </div>
                        <div className="font-sans text-xs text-slate-500 text-center font-medium leading-tight h-8 flex items-center">{label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-1">
          <Card variant="light" className="h-full p-0 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="font-serif font-bold text-lg text-slate-900">Atividade Recente</h3>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
              {data?.recentNotes && data.recentNotes.length > 0 ? (
                <div className="space-y-6">
                  {data.recentNotes.map((note, idx) => {
                    const Icon = NOTE_TYPE_ICON[note.type] || FileText;
                    return (
                      <div key={note.id} className="relative pl-6">
                        {/* Timeline line */}
                        {idx !== data.recentNotes.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-200"></div>
                        )}
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                          <Icon className="w-3 h-3" />
                        </div>
                        
                        <div className="mb-1">
                          <span className="font-sans font-semibold text-sm text-slate-900 mr-2">{note.case.client.name}</span>
                          <span className="font-sans text-xs text-slate-500">{formatDate(note.createdAt)}</span>
                        </div>
                        <p className="font-sans text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">
                          {note.content}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="font-sans font-medium text-sm text-slate-900">Nenhuma atividade</p>
                  <p className="font-sans text-sm text-slate-500 mt-1">As notas adicionadas aos casos aparecerão aqui.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

      {!data && !loading && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">Bem-vindo ao Previando</h3>
          <p className="font-sans text-slate-500 mb-6 max-w-md mx-auto">
            Seu painel está vazio no momento. Cadastre seu primeiro cliente para começar a acompanhar seus processos e métricas.
          </p>
          <Link href="/clients/list" className="neo-btn inline-flex items-center gap-2">
            Cadastrar Cliente
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
