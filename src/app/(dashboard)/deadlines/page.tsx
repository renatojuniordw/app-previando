'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react'
import { BENEFIT_SHORT_LABELS } from '@/lib/constants'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { useRouter } from 'next/navigation'
import { downloadPdf } from '@/lib/download-pdf'
import { useToast } from '@/store/toast'

interface DeadlineCase {
  id: string
  status: string
  priority: string
  benefitType: string
  deadlineDate: string
  daysLeft: number | null
  client: { id: string; name: string }
}

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  ATTENTION: 'bg-amber-100 text-amber-700',
  NORMAL: 'bg-slate-100 text-slate-600',
}

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'Crítico',
  ATTENTION: 'Atenção',
  NORMAL: 'Normal',
}

function urgencyClass(daysLeft: number | null): string {
  if (daysLeft === null) return 'bg-slate-100 text-slate-500'
  if (daysLeft < 0) return 'bg-red-200 text-red-800'
  if (daysLeft <= 1) return 'bg-red-100 text-red-700'
  if (daysLeft <= 3) return 'bg-amber-100 text-amber-700'
  if (daysLeft <= 7) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

function urgencyLabel(daysLeft: number | null): string {
  if (daysLeft === null) return '—'
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d atrasado`
  if (daysLeft === 0) return 'Hoje!'
  return `${daysLeft}d`
}

function DeadlineRow({ d, onNavigate, onDownloadError }: { d: DeadlineCase; onNavigate: (path: string) => void; onDownloadError: () => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
      <Link href={`/cases/${d.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-14 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${urgencyClass(d.daysLeft)}`}>
          {urgencyLabel(d.daysLeft)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate group-hover:text-amber-600 transition-colors">{d.client.name}</p>
          <p className="text-xs text-slate-500 truncate">
            {BENEFIT_SHORT_LABELS[d.benefitType] ?? d.benefitType} · {new Date(d.deadlineDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[d.priority] ?? ''}`}>
          {PRIORITY_LABEL[d.priority] ?? d.priority}
        </span>
      </Link>
      <ActionsDropdown
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

  return (
    <ErrorBoundary>
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-amber-600" />
        <h1 className="font-serif font-bold text-2xl text-slate-900">Prazos dos Próximos 30 dias</h1>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
        </div>
      ) : deadlines.length === 0 ? (
        <Card variant="light" className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Nenhum prazo nos próximos 30 dias</p>
          <p className="text-sm text-slate-500 mt-1">Seus casos com prazo definido aparecerão aqui.</p>
        </Card>
      ) : (
        <>
          {overdue.length > 0 && (
            <Card variant="light" className="p-0 overflow-hidden border-red-200">
              <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-sm text-red-700">Atrasados ({overdue.length})</span>
              </div>
              {overdue.map((d) => <DeadlineRow key={d.id} d={d} onNavigate={router.push} onDownloadError={() => addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })} />)}
            </Card>
          )}

          {urgent.length > 0 && (
            <Card variant="light" className="p-0 overflow-hidden border-amber-200">
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-sm text-amber-700">Urgentes — até 3 dias ({urgent.length})</span>
              </div>
              {urgent.map((d) => <DeadlineRow key={d.id} d={d} onNavigate={router.push} onDownloadError={() => addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })} />)}
            </Card>
          )}

          {upcoming.length > 0 && (
            <Card variant="light" className="p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-sm text-slate-700">Próximos ({upcoming.length})</span>
              </div>
              {upcoming.map((d) => <DeadlineRow key={d.id} d={d} onNavigate={router.push} onDownloadError={() => addToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })} />)}
            </Card>
          )}
        </>
      )}
    </div>
    </ErrorBoundary>
  )
}
