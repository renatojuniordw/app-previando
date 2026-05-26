'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

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

const BENEFIT_LABELS: Record<string, string> = {
  APOSENTADORIA_IDADE: 'Aposentadoria por Idade',
  APOSENTADORIA_TEMPO_CONTRIBUICAO: 'Aposentadoria por Tempo de Contribuição',
  APOSENTADORIA_ESPECIAL: 'Aposentadoria Especial',
  APOSENTADORIA_HIBRIDA: 'Aposentadoria Híbrida',
  APOSENTADORIA_PONTOS: 'Aposentadoria por Pontos',
  AUXILIO_DOENCA: 'Auxílio-Doença',
  AUXILIO_ACIDENTE: 'Auxílio-Acidente',
  SALARIO_MATERNIDADE: 'Salário-Maternidade',
  AUXILIO_RECLUSAO: 'Auxílio-Reclusão',
  PENSAO_POR_MORTE: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
  REVISAO_BENEFICIO: 'Revisão de Benefício',
}

export default function CaseOverviewPage() {
  const params = useParams()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

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
      load()
    } catch {
      // noop
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleExportPDF = () => {
    window.open(`/api/export/pdf/${params.id}`, '_blank')
  }

  if (loading) {
    return <div className="font-mono text-slate-400 animate-pulse">Carregando...</div>
  }

  if (!caseData) {
    return <div className="font-mono text-slate-400">Caso não encontrado.</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Informações principais */}
      <Card variant="dark">
        <CardHeader
          title="Informações do Caso"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowStatusModal(true)}>
                ALTERAR STATUS
              </Button>
              <Button size="sm" onClick={handleExportPDF}>
                EXPORTAR PDF
              </Button>
            </div>
          }
        />
        <div className="grid grid-cols-2 gap-4 text-sm font-mono">
          <div>
            <span className="text-slate-400 text-xs uppercase">Benefício</span>
            <p className="text-white mt-0.5">{BENEFIT_LABELS[caseData.benefitType] ?? caseData.benefitType}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase">Status</span>
            <p className="text-white mt-0.5">
              {STATUS_OPTIONS.find((s) => s.value === caseData.status)?.label ?? caseData.status}
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase">Criado em</span>
            <p className="text-white mt-0.5">{formatDate(caseData.createdAt)}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase">Prazo</span>
            <p className="text-white mt-0.5">{caseData.deadlineDate ? formatDate(caseData.deadlineDate) : '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase">CNIS</span>
            <p className="text-white mt-0.5">
              {caseData.cnisDocument
                ? caseData.cnisDocument.processingStatus
                : 'Não enviado'}
            </p>
          </div>
        </div>
        {caseData.notes && (
          <div className="mt-4 p-3 border border-slate-700 font-mono text-xs text-slate-300">
            {caseData.notes}
          </div>
        )}
      </Card>

      {/* Resumo de atividades */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="dark">
          <div className="font-mono text-slate-400 text-xs uppercase mb-1">Anotações</div>
          <div className="font-mono font-black text-2xl text-white">{caseData._count.caseNotes}</div>
        </Card>
        <Card variant="dark">
          <div className="font-mono text-slate-400 text-xs uppercase mb-1">Cálculos</div>
          <div className="font-mono font-black text-2xl text-white">{caseData._count.calculations}</div>
        </Card>
        <Card variant="dark">
          <div className="font-mono text-slate-400 text-xs uppercase mb-1">Checklist</div>
          <div className="font-mono font-black text-2xl text-white">{caseData._count.checklists}</div>
        </Card>
      </div>

      {/* Modal alterar status */}
      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="ALTERAR STATUS">
        <div className="space-y-4">
          <div>
            <label className="neo-label">Novo Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="neo-input"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleStatusChange} loading={updatingStatus} className="flex-1">
              SALVAR
            </Button>
            <Button variant="outline" onClick={() => setShowStatusModal(false)} className="flex-1">
              CANCELAR
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
