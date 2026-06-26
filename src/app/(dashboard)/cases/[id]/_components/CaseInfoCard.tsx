import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { BENEFIT_LABELS } from '@/lib/constants'
import type { CaseDetail } from '../_types'
import { STATUS_OPTIONS, PRIORITY_VARIANT } from '../_constants'

interface Props {
  caseData: CaseDetail
  onStatusChangeClick: () => void
  onExportPDF: () => void
}

export function CaseInfoCard({ caseData, onStatusChangeClick, onExportPDF }: Props) {
  return (
    <Card variant="light" className="overflow-hidden">
      <CardHeader
        title="Informações do Caso"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onStatusChangeClick}>
              Alterar Status
            </Button>
            <Button size="sm" onClick={onExportPDF}>
              Exportar PDF
            </Button>
          </div>
        }
      />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoField label="Benefício">
            <p className="font-sans font-semibold text-slate-900">
              {BENEFIT_LABELS[caseData.benefitType] ?? caseData.benefitType}
            </p>
          </InfoField>
          <InfoField label="Status">
            <Badge variant="slate">
              {STATUS_OPTIONS.find((s) => s.value === caseData.status)?.label ?? caseData.status}
            </Badge>
          </InfoField>
          <InfoField label="Prioridade">
            <Badge variant={PRIORITY_VARIANT[caseData.priority] ?? 'slate'}>
              {caseData.priority}
            </Badge>
          </InfoField>
        </div>
        <div className="space-y-4">
          <InfoField label="Criado em">
            <p className="font-sans font-semibold text-slate-900">{formatDate(caseData.createdAt)}</p>
          </InfoField>
          <InfoField label="Prazo">
            <p className="font-sans font-semibold text-slate-900">
              {caseData.deadlineDate ? formatDate(caseData.deadlineDate) : '—'}
            </p>
          </InfoField>
          <InfoField label="CNIS">
            <p className="font-sans font-semibold text-slate-900">
              {caseData.cnisDocument
                ? caseData.cnisDocument.processingStatus === 'COMPLETED'
                  ? 'Processado'
                  : caseData.cnisDocument.processingStatus
                : 'Não enviado'}
            </p>
          </InfoField>
        </div>
      </div>
      {caseData.notes && (
        <div className="mx-6 mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="font-sans text-sm text-amber-800 whitespace-pre-wrap">{caseData.notes}</p>
        </div>
      )}
    </Card>
  )
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
        {label}
      </span>
      {children}
    </div>
  )
}
