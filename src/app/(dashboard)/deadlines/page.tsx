'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Clock, AlertTriangle, CheckCircle2, Calendar, ArrowLeft } from 'lucide-react'
import { BENEFIT_SHORT_LABELS } from '@/lib/constants'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { useRouter } from 'next/navigation'
import { downloadPdf } from '@/lib/download-pdf'
import { useToast } from '@/store/toast'
import { cn } from '@/lib/utils'

interface DeadlineCase {
  id: string
  status: string
  priority: string
  benefitType: string
  deadlineDate: string
  daysLeft: number | null
  client: { id: string; name: string }
}

const PRIORITY_BADGE_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-150',
  ATTENTION: 'bg-amber-50 text-amber-700 border-amber-150',
  NORMAL: 'bg-slate-50 text-slate-655 border-slate-200',
}

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'Crítico',
  ATTENTION: 'Atenção',
  NORMAL: 'Normal',
}

function urgencyClass(daysLeft: number | null): string {
  if (daysLeft === null) return 'bg-slate-50 text-slate-400 border border-slate-200'
  if (daysLeft < 0) return 'bg-red-50 text-red-700 border border-red-150 shadow-inner shadow-red-100/30'
  if (daysLeft <= 1) return 'bg-red-50 text-red-700 border border-red-150'
  if (daysLeft <= 3) return 'bg-amber-50/80 text-amber-700 border border-amber-150'
  if (daysLeft <= 7) return 'bg-yellow-50 text-yellow-700 border border-yellow-150'
  return 'bg-emerald-50 text-emerald-700 border border-emerald-150'
}

function urgencyLabel(daysLeft: number | null): string {
  if (daysLeft === null) return '—'
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d atrasado`
  if (daysLeft === 0) return 'Hoje!'
  return `${daysLeft}d`
}

function DeadlineRow({ d, onNavigate, onDownloadError, showFirstVisitHint }: { d: DeadlineCase; onNavigate: (path: string) => void; onDownloadError: () => void; showFirstVisitHint?: boolean }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/40 transition-colors border-b border-slate-100 last:border-0 group">
      <Link href={`/cases/${d.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className={cn(
          "w-18 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono tracking-tight shrink-0",
          urgencyClass(d.daysLeft)
        )}>
          {urgencyLabel(d.daysLeft)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-bold text-sm text-slate-800 truncate group-hover:text-amber-700 transition-colors">{d.client.name}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
            {BENEFIT_SHORT_LABELS[d.benefitType] ?? d.benefitType} · <span className="font-mono">{new Date(d.deadlineDate).toLocaleDateString('pt-BR')}</span>
          </p>
        </div>
        <span className={cn(
          "shrink-0 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border",
          PRIORITY_BADGE_STYLE[d.priority] || ''
        )}>
          {PRIORITY_LABEL[d.priority] ?? d.priority}
        </span>
      </Link>
      <ActionsDropdown
        showFirstVisitHint={showFirstVisitHint}
        ariaLabel={`Ações para ${d.client.name}`}
        actions={[
          { label: 'Ver Caso', onClick: () => onNavigate(`/cases/${d.id}`) },
          { label: 'Exportar PDF', onClick: () => downloadPdf(d.id).then((ok) => { if (!ok) onDownloadError() }) },
          { label: 'Acessar Cálculo', onClick: () => onNavigate(`/cases/${d.id}/calculator`) },
        ]}
      />
    </div>
  )
}

export default function DeadlinesPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [deadlines, setDeadlines] = useState<DeadlineCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/deadlines')
      .then((r) => setDeadlines(r.data.deadlines))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const overdue = deadlines.filter((d) => (d.daysLeft ?? 0) < 0)
  const urgent = deadlines.filter((d) => d.daysLeft !== null && d.daysLeft >= 0 && d.daysLeft <= 3)
  const upcoming = deadlines.filter((d) => d.daysLeft !== null && d.daysLeft > 3)
  const firstDeadlineId = overdue[0]?.id ?? urgent[0]?.id ?? upcoming[0]?.id

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-fade-in">

      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg flex-shrink-0">
          <Clock className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Painel de Prazos</h1>
          <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">Controle de prazos e vencimentos agendados para os próximos 30 dias.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
          <p className="font-sans font-medium text-slate-500 mt-4 animate-pulse">Carregando vencimentos...</p>
        </div>
      ) : deadlines.length === 0 ? (
        <Card variant="light" className="p-16 text-center border-slate-200/80 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900">Tudo em dia!</h3>
          <p className="font-sans text-slate-500 text-sm mt-1 max-w-sm font-medium">
            Nenhum prazo cadastrado para os próximos 30 dias.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 lg:space-y-8">
          {overdue.length > 0 && (
            <Card variant="light" className="p-0 overflow-hidden border-red-250 shadow-sm">
              <div className="px-5 py-3.5 bg-red-50/30 border-b border-red-100/50 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-650" />
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-red-750">Atrasados ({overdue.length})</span>
              </div>
              {overdue.map((d) => <DeadlineRow key={d.id} d={d} onNavigate={router.push} onDownloadError={() => addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })} showFirstVisitHint={d.id === firstDeadlineId} />)}
            </Card>
          )}

          {urgent.length > 0 && (
            <Card variant="light" className="p-0 overflow-hidden border-amber-250 shadow-sm">
              <div className="px-5 py-3.5 bg-amber-50/20 border-b border-amber-100/50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-amber-700">Urgentes — até 3 dias ({urgent.length})</span>
              </div>
              {urgent.map((d) => <DeadlineRow key={d.id} d={d} onNavigate={router.push} onDownloadError={() => addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })} showFirstVisitHint={d.id === firstDeadlineId} />)}
            </Card>
          )}

          {upcoming.length > 0 && (
            <Card variant="light" className="p-0 overflow-hidden border-slate-200/80 shadow-sm">
              <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-150 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-700">Próximos ({upcoming.length})</span>
              </div>
              {upcoming.map((d) => <DeadlineRow key={d.id} d={d} onNavigate={router.push} onDownloadError={() => addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })} showFirstVisitHint={d.id === firstDeadlineId} />)}
            </Card>
          )}
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
