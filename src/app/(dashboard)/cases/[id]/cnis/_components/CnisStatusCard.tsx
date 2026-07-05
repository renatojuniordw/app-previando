import { CnisData, CnisExtractedData } from '../_types'
import { CnisProcessingStepper } from './CnisProcessingStepper'
import { CnisExtractedDataView } from './CnisExtractedData'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  cnis: CnisData
  isProcessing: boolean
  stuckWarning: boolean
  tempExtractedData: CnisExtractedData | null
  onReprocessClick: () => void
  onUploadClick: () => void
  onDeleteCnisClick: () => void
  onEditField: (field: keyof CnisExtractedData, value: string) => void
  onExportCSV: () => void
  onAddPeriod: () => void
  onEditPeriod: (idx: number) => void
  onEditSalaries: (idx: number) => void
  onDeletePeriod: (idx: number) => void
}

export function CnisStatusCard({
  cnis, isProcessing, stuckWarning, tempExtractedData,
  onReprocessClick, onUploadClick, onDeleteCnisClick,
  onEditField, onExportCSV, onAddPeriod, onEditPeriod, onEditSalaries, onDeletePeriod,
}: Props) {
  const showExtracted = ['COMPLETED', 'SUMMARY_READY'].includes(cnis.processingStatus) && !!tempExtractedData

  if (isProcessing) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <CnisProcessingStepper processingStatus={cnis.processingStatus} stuckWarning={stuckWarning} />
      </div>
    )
  }

  if (cnis.processingStatus === 'FAILED') {
    return (
      <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm">
        <div className="border border-red-200 bg-red-50/20 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-sans text-sm font-bold text-red-805">Falha no Processamento</p>
              <p className="font-sans text-xs text-red-750 mt-1 leading-relaxed font-semibold">
                {cnis.processingError
                  ? cnis.processingError.replace(/^Error:\s*/i, '')
                  : 'Ocorreu um erro inesperado ao tentar ler este arquivo CNIS.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-red-100/60">
            <Button 
              variant="danger"
              size="sm"
              onClick={onReprocessClick} 
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-once" />
              Reprocessar
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={onUploadClick}
            >
              Enviar Outro PDF
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showExtracted && tempExtractedData) {
    return (
      <CnisExtractedDataView
        data={tempExtractedData}
        cnisCreatedAt={cnis.createdAt}
        cnisUpdatedAt={cnis.updatedAt}
        cnisStatus={cnis.processingStatus}
        onReprocessClick={onReprocessClick}
        onUploadClick={onUploadClick}
        onDeleteCnisClick={onDeleteCnisClick}
        onEditField={onEditField}
        onExportCSV={onExportCSV}
        onAddPeriod={onAddPeriod}
        onEditPeriod={onEditPeriod}
        onEditSalaries={onEditSalaries}
        onDeletePeriod={onDeletePeriod}
      />
    )
  }

  return null
}
