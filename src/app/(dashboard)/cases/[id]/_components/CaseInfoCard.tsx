import { Card } from '@/components/ui/Card'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { formatDate } from '@/lib/utils'
import { BENEFIT_LABELS } from '@/lib/constants'
import type { CaseDetail } from '../_types'
import { STATUS_OPTIONS } from '../_constants'
import { Shield, Activity, AlertCircle, Calendar, FileText, ArrowRight, Edit, FileDown, RefreshCw, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useUpgradeModal } from '@/store/upgrade-modal'

interface Props {
  caseData: CaseDetail
  onStatusChangeClick: () => void
  onExportPDF: () => void
  onEditClick?: () => void
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

export function CaseInfoCard({ caseData, onStatusChangeClick, onExportPDF, onEditClick }: Props) {
  const openUpgradeModal = useUpgradeModal((s) => s.openModal)
  const isOverdue = caseData.deadlineDate ? new Date(caseData.deadlineDate) < new Date() : false
  const deadlineColor = isOverdue ? 'text-red-600' : 'text-slate-800'

  // Cadeado explícito: sem ele o clique iria à API, receberia 402 fora do
  // interceptor axios (o download usa fetch puro) e pareceria bug.
  const exportPdfLocked = caseData.planLimits ? !caseData.planLimits.exportPdfEnabled : false
  const handleExportClick = exportPdfLocked
    ? () => openUpgradeModal({ message: '', feature: 'EXPORT_PDF', upgradeRequired: 'SOLO' })
    : onExportPDF

  return (
    <Card variant="light" className="overflow-hidden border-slate-200/80 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-serif font-bold text-base text-slate-900 tracking-tight">Informações do Caso</h3>
          <p className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Visão Geral e Metadados</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionsDropdown 
            actions={[
              { label: 'Alterar Status', icon: <RefreshCw className="w-4 h-4" />, onClick: onStatusChangeClick },
              { label: 'Editar Caso', icon: <Edit className="w-4 h-4" />, onClick: () => onEditClick?.() },
              { label: 'Exportar PDF', icon: exportPdfLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <FileDown className="w-4 h-4" />, onClick: handleExportClick }
            ]} 
          />
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white">
        <div className="space-y-5">
          <InfoField icon={<Shield className="w-4 h-4" />} label="Benefício">
            <p className="font-sans font-bold text-sm text-slate-800 leading-snug">
              {BENEFIT_LABELS[caseData.benefitType] ?? caseData.benefitType}
            </p>
          </InfoField>
          <InfoField icon={<Activity className="w-4 h-4" />} label="Status">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-wider bg-slate-50 text-slate-655 border-slate-200 mt-1">
              {STATUS_OPTIONS.find((s) => s.value === caseData.status)?.label ?? caseData.status}
            </span>
          </InfoField>
          <InfoField icon={<AlertCircle className="w-4 h-4" />} label="Prioridade">
            <span className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-md border text-[9px] font-extrabold uppercase tracking-wider mt-1",
              PRIORITY_BADGE_STYLE[caseData.priority] || 'bg-slate-50 text-slate-655 border-slate-200'
            )}>
              {PRIORITY_LABEL[caseData.priority] ?? caseData.priority}
            </span>
          </InfoField>
        </div>
        <div className="space-y-5">
          <InfoField icon={<Calendar className="w-4 h-4" />} label="Criado em">
            <p className="font-sans font-bold text-sm text-slate-800 font-mono">{formatDate(caseData.createdAt)}</p>
          </InfoField>
          <InfoField icon={<Calendar className="w-4 h-4" />} label="Prazo">
            <p className={cn("font-sans font-bold text-sm font-mono", deadlineColor)}>
              {caseData.deadlineDate ? formatDate(caseData.deadlineDate) : '—'}
            </p>
          </InfoField>
          <InfoField icon={<FileText className="w-4 h-4" />} label="CNIS">
            {caseData.cnisDocument ? (
              caseData.cnisDocument.processingStatus === 'COMPLETED' ? (
                <Link 
                  href={`/cases/${caseData.id}/cnis`}
                  className="font-sans font-bold text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 group mt-1.5"
                >
                  Ver Extrato <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <span className="font-sans font-bold text-xs text-slate-500 flex items-center gap-2 mt-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" /> {caseData.cnisDocument.processingStatus}
                </span>
              )
            ) : (
              <Link 
                href={`/cases/${caseData.id}/cnis`}
                className="font-sans font-bold text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mt-1.5"
              >
                Fazer Upload
              </Link>
            )}
          </InfoField>
        </div>
      </div>
      {caseData.notes && (
        <div className="mx-6 mb-6 p-4 border-l-4 border-amber-500 bg-amber-50/15 rounded-r-xl relative group">
          <p className="font-sans text-xs text-amber-800 whitespace-pre-wrap leading-relaxed">{caseData.notes}</p>
          <button 
            className="absolute top-2.5 right-2.5 p-1.5 bg-white/70 hover:bg-white border border-amber-100 rounded text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
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
      <div className="flex items-center gap-1.5 mb-1.5 text-slate-400">
        {icon}
        <span className="font-sans text-[10px] uppercase font-extrabold tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
