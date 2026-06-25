'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/store/toast'
import { BENEFIT_LABELS } from '@/lib/constants'
import { Scale, MessageSquare, CheckSquare, AlertCircle } from 'lucide-react'

interface CaseDetail {
  id: string
  status: string
  benefitType: string
  priority: string
  notes: string | null
  deadlineDate: string | null
  createdAt: string
  updatedAt: string
  client: { id: string; name: string; phone: string | null }
  cnisDocument: { processingStatus: string } | null
  _count: { caseNotes: number; calculations: number; checklists: number }
}

const STATUS_OPTIONS = [
  { value: 'PROSPECCAO', label: 'Prospecção' },
  { value: 'ANALISE', label: 'Análise' },
  { value: 'PRONTO_PARA_REQUERER', label: 'Pronto p/ Requerer' },
  { value: 'EM_PROCESSAMENTO', label: 'Em Processamento' },
  { value: 'FINALIZADO', label: 'Finalizado' },
]

const PRIORITY_VARIANT: Record<string, 'red' | 'yellow' | 'slate'> = {
  CRITICAL: 'red',
  ATTENTION: 'yellow',
  NORMAL: 'slate',
}

export default function CaseOverviewPage() {
  const params = useParams()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const { addToast } = useToast()

  const load = useCallback(() => {
    api.get(`/cases/${params.id}`)
      .then((r) => {
        setCaseData(r.data.case)
        setNewStatus(r.data.case.status)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async () => {
    setUpdatingStatus(true)
    try {
      await api.patch(`/cases/${params.id}/status`, { status: newStatus })
      setShowStatusModal(false)
      addToast({ type: 'success', title: 'Status alterado', message: `Caso atualizado para ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label ?? newStatus}.` })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível alterar o status.' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleExportPDF = () => {
    window.open(`/api/export/pdf/${params.id}`, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl animate-pulse">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 bg-slate-200 rounded" />
                <div className="h-5 w-32 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="font-sans font-medium text-slate-500">Caso não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Informações principais */}
      <Card variant="light" className="overflow-hidden">
        <CardHeader
          title="Informações do Caso"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowStatusModal(true)}>
                Alterar Status
              </Button>
              <Button size="sm" onClick={handleExportPDF}>
                Exportar PDF
              </Button>
            </div>
          }
        />
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Benefício</span>
              <p className="font-sans font-semibold text-slate-900">{BENEFIT_LABELS[caseData.benefitType] ?? caseData.benefitType}</p>
            </div>
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Status</span>
              <Badge variant="slate">{STATUS_OPTIONS.find((s) => s.value === caseData.status)?.label ?? caseData.status}</Badge>
            </div>
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Prioridade</span>
              <Badge variant={PRIORITY_VARIANT[caseData.priority] ?? 'slate'}>{caseData.priority}</Badge>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Criado em</span>
              <p className="font-sans font-semibold text-slate-900">{formatDate(caseData.createdAt)}</p>
            </div>
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Prazo</span>
              <p className="font-sans font-semibold text-slate-900">{caseData.deadlineDate ? formatDate(caseData.deadlineDate) : '—'}</p>
            </div>
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">CNIS</span>
              <p className="font-sans font-semibold text-slate-900">
                {caseData.cnisDocument
                  ? caseData.cnisDocument.processingStatus === 'COMPLETED' ? 'Processado' : caseData.cnisDocument.processingStatus
                  : 'Não enviado'}
              </p>
            </div>
          </div>
        </div>
        {caseData.notes && (
          <div className="mx-6 mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="font-sans text-sm text-amber-800 whitespace-pre-wrap">{caseData.notes}</p>
          </div>
        )}
      </Card>

      {/* Resumo de atividades */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="light" className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="font-sans text-xs text-slate-500 uppercase font-bold tracking-wider">Anotações</p>
            <p className="font-sans font-bold text-2xl text-slate-900 mt-0.5">{caseData._count.caseNotes}</p>
          </div>
        </Card>
        <Card variant="light" className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="font-sans text-xs text-slate-500 uppercase font-bold tracking-wider">Cálculos</p>
            <p className="font-sans font-bold text-2xl text-slate-900 mt-0.5">{caseData._count.calculations}</p>
          </div>
        </Card>
        <Card variant="light" className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="font-sans text-xs text-slate-500 uppercase font-bold tracking-wider">Checklist</p>
            <p className="font-sans font-bold text-2xl text-slate-900 mt-0.5">{caseData._count.checklists}</p>
          </div>
        </Card>
      </div>

      {/* Modal alterar status */}
      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Alterar Status do Caso">
        <div className="space-y-4">
          <div>
            <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Novo Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleStatusChange} loading={updatingStatus} className="flex-1">
              Salvar
            </Button>
            <Button variant="outline" onClick={() => setShowStatusModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
