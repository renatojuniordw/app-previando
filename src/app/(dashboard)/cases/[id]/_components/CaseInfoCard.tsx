import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { formatDate } from '@/lib/utils'
import { BENEFIT_LABELS } from '@/lib/constants'
import type { CaseDetail } from '../_types'
import { STATUS_OPTIONS, PRIORITY_VARIANT } from '../_constants'
import { Shield, Activity, AlertCircle, Calendar, FileText, ArrowRight, Edit, FileDown, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Props {
  caseData: CaseDetail
  onStatusChangeClick: () => void
  onExportPDF: () => void
  onEditClick?: () => void
}

export function CaseInfoCard({ caseData, onStatusChangeClick, onExportPDF, onEditClick }: Props) {
  const isOverdue = caseData.deadlineDate ? new Date(caseData.deadlineDate) < new Date() : false
  const deadlineColor = isOverdue ? 'text-red-600' : 'text-slate-900'

  return (
    <Card variant="light" className="overflow-hidden">
      <CardHeader
        title="Informações do Caso"
        action={
          <div className="flex align-items-center gap-2">
            <ActionsDropdown 
              actions={[
                { label: 'Alterar Status', icon: <RefreshCw className="w-4 h-4" />, onClick: onStatusChangeClick },
                { label: 'Editar Caso', icon: <Edit className="w-4 h-4" />, onClick: () => onEditClick?.() },
                { label: 'Exportar PDF', icon: <FileDown className="w-4 h-4" />, onClick: onExportPDF }
              ]} 
            />
          </div>
        }
      />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-5">
          <InfoField icon={<Shield className="w-4 h-4" />} label="Benefício">
            <p className="font-sans font-semibold text-slate-900">
              {BENEFIT_LABELS[caseData.benefitType] ?? caseData.benefitType}
            </p>
          </InfoField>
          <InfoField icon={<Activity className="w-4 h-4" />} label="Status">
            <Badge variant="slate">
              {STATUS_OPTIONS.find((s) => s.value === caseData.status)?.label ?? caseData.status}
            </Badge>
          </InfoField>
          <InfoField icon={<AlertCircle className="w-4 h-4" />} label="Prioridade">
            <Badge variant={PRIORITY_VARIANT[caseData.priority] ?? 'slate'}>
              {caseData.priority}
            </Badge>
          </InfoField>
        </div>
        <div className="space-y-5">
          <InfoField icon={<Calendar className="w-4 h-4" />} label="Criado em">
            <p className="font-sans font-semibold text-slate-900">{formatDate(caseData.createdAt)}</p>
          </InfoField>
          <InfoField icon={<Calendar className="w-4 h-4" />} label="Prazo">
            <p className={`font-sans font-semibold ${deadlineColor}`}>
              {caseData.deadlineDate ? formatDate(caseData.deadlineDate) : '—'}
            </p>
          </InfoField>
          <InfoField icon={<FileText className="w-4 h-4" />} label="CNIS">
            {caseData.cnisDocument ? (
              caseData.cnisDocument.processingStatus === 'COMPLETED' ? (
                <Link 
                  href={`/cases/${caseData.id}/cnis`}
                  className="font-sans font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] flex align-items-center gap-1 group"
                >
                  Ver Extrato <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <span className="font-sans font-semibold text-slate-500 flex align-items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" /> {caseData.cnisDocument.processingStatus}
                </span>
              )
            ) : (
              <Link 
                href={`/cases/${caseData.id}/cnis`}
                className="font-sans font-semibold text-slate-500 hover:text-slate-700 flex align-items-center gap-1"
              >
                Fazer Upload
              </Link>
            )}
          </InfoField>
        </div>
      </div>
      {caseData.notes && (
        <div className="mx-6 mb-6 p-4 bg-[var(--color-primary-tint)] border border-[#F5D0C3] rounded-lg relative group">
          <p className="font-sans text-sm text-[#A03A15] whitespace-pre-wrap">{caseData.notes}</p>
          <button 
            className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-white rounded text-[var(--color-primary-dark)] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEditClick?.()}
            title="Editar notas"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </Card>
  )
}

function InfoField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex align-items-center gap-1.5 mb-1.5 text-slate-400">
        {icon}
        <span className="font-sans text-[10px] uppercase font-bold tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
