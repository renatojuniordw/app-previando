import { AlertCircle, Calendar, CheckCircle2, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { CnisData, CnisExtractedData } from '../_types'
import { STATUS_CONFIG } from '../_constants'
import { CnisProcessingStepper } from './CnisProcessingStepper'
import { CnisExtractedDataView } from './CnisExtractedData'

interface Props {
  cnis: CnisData
  isProcessing: boolean
  stuckWarning: boolean
  tempExtractedData: CnisExtractedData | null
  onReprocessClick: () => void
  onUploadClick: () => void
  onEditField: (field: keyof CnisExtractedData, value: string) => void
  onExportCSV: () => void
  onAddPeriod: () => void
  onEditPeriod: (idx: number) => void
  onEditSalaries: (idx: number) => void
  onDeletePeriod: (idx: number) => void
}

export function CnisStatusCard({
  cnis, isProcessing, stuckWarning, tempExtractedData,
  onReprocessClick, onUploadClick,
  onEditField, onExportCSV, onAddPeriod, onEditPeriod, onEditSalaries, onDeletePeriod,
}: Props) {
  const config = STATUS_CONFIG[cnis.processingStatus] || { label: cnis.processingStatus, color: 'slate' as const }
  const showExtracted = ['COMPLETED', 'SUMMARY_READY'].includes(cnis.processingStatus) && !!tempExtractedData

  return (
    <div className="neo-card-flat rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-4 bg-[var(--color-surface)]/50">
        <div className="flex align-items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5D0C3] flex align-items-center justify-content-center border border-[#F0B09A] text-[var(--color-primary)]">
            <FileText className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-slate-900 flex align-items-center gap-2">
              Documento CNIS
              {cnis.downloadUrl && (
                <a href={cnis.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[var(--color-primary)] transition-colors md:hidden" title="Abrir PDF em nova aba">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </h3>
            <p className="font-sans text-xs text-slate-500 font-medium">Análise e Leitura Automática</p>
          </div>
        </div>
        <Badge variant={config.color} className="shadow-sm">{config.label}</Badge>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--color-card-inner)] border border-[var(--color-border)] rounded-lg p-4 flex flex-column justify-content-center">
            <div className="flex align-items-center gap-2 text-slate-500 mb-1">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider">Enviado Em</span>
            </div>
            <p className="font-sans font-semibold text-slate-900 text-sm">{formatDate(cnis.createdAt)}</p>
          </div>

          {['COMPLETED', 'SUMMARY_READY', 'PROCESSING_DETAILS'].includes(cnis.processingStatus) && (
            <div className="bg-[var(--color-card-inner)] border border-[var(--color-border)] rounded-lg p-4 flex flex-column justify-content-center">
              <div className="flex align-items-center gap-2 text-slate-500 mb-1">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span className="font-sans text-[10px] uppercase font-bold tracking-wider">Última Atualização</span>
              </div>
              <p className="font-sans font-semibold text-slate-900 text-sm">{formatDate(cnis.updatedAt)}</p>
            </div>
          )}
        </div>

        {isProcessing && <CnisProcessingStepper processingStatus={cnis.processingStatus} stuckWarning={stuckWarning} />}

        {cnis.processingStatus === 'FAILED' && (
          <div className="bg-[var(--color-error-bg)] rounded-lg p-4 flex flex-column gap-3">
            <div className="flex align-items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-sans text-sm font-bold text-red-800">Falha no Processamento</p>
                <p className="font-sans text-sm text-red-700 mt-1">
                  {cnis.processingError
                    ? cnis.processingError.replace(/^Error:\s*/i, '')
                    : 'Ocorreu um erro inesperado ao tentar ler este arquivo CNIS.'}
                </p>
              </div>
            </div>
            <div className="flex align-items-center gap-2 pt-1 border-t border-red-150">
              <button onClick={onReprocessClick} className="bg-red-600 hover:bg-red-700 text-white font-sans font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex align-items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none">
                <RefreshCw className="w-3.5 h-3.5" />
                Reprocessar sem Reupload
              </button>
              <button onClick={onUploadClick} className="border border-red-200 text-red-700 hover:bg-red-100 font-sans font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500">
                Enviar Outro PDF
              </button>
            </div>
          </div>
        )}

        {showExtracted && (
          <CnisExtractedDataView
            data={tempExtractedData!}
            onEditField={onEditField}
            onExportCSV={onExportCSV}
            onAddPeriod={onAddPeriod}
            onEditPeriod={onEditPeriod}
            onEditSalaries={onEditSalaries}
            onDeletePeriod={onDeletePeriod}
          />
        )}
      </div>
    </div>
  )
}
