'use client'

import { useState } from 'react'
import { FileText, Upload, Loader2, Download, RotateCcw, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, cn } from '@/lib/utils'
import { useCnis } from '@/hooks/useCnis'
import { useCnisUpload } from '@/hooks/useCnisUpload'
import { STATUS_CONFIG, isProcessingStatus } from '@/lib/cnis-status'
import type { CnisExtractedData } from '@/types/cnis'

interface Props {
  clientId: string
  caseCount: number
}

export function ClientCnisCard({ clientId, caseCount }: Props) {
  const { cnis, loading, showSuccessBanner, load, handleDelete, handleReprocess } = useCnis(clientId)
  const { uploading, uploadError, isDragging, fileRef, handleUpload, handleDragOver, handleDragLeave, handleDrop } = useCnisUpload(clientId, load)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reprocessing, setReprocessing] = useState(false)
  const [actionError, setActionError] = useState('')

  const isProcessing = cnis ? isProcessingStatus(cnis.processingStatus) : false
  const statusCfg = cnis ? STATUS_CONFIG[cnis.processingStatus] : null
  const extractedData = cnis?.extractedData as unknown as CnisExtractedData | null

  return (
    <Card variant="light" className="p-6 border-slate-200/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="font-serif font-bold text-lg text-slate-900">CNIS do Segurado</h2>
          <p className="font-sans text-xs text-slate-500 mt-0.5">
            {caseCount > 1
              ? `Documento único, compartilhado pelos ${caseCount} processos deste cliente.`
              : 'Extrato de contribuições do segurado — base para os cálculos de qualquer processo deste cliente.'}
          </p>
        </div>
        {statusCfg && (
          <Badge variant={statusCfg.color}>
            {statusCfg.label}
          </Badge>
        )}
      </div>

      {actionError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
          <p className="font-sans text-xs font-medium text-red-700">{actionError}</p>
        </div>
      )}

      {uploadError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
          <p className="font-sans text-xs font-medium text-red-700">{uploadError}</p>
        </div>
      )}

      {showSuccessBanner && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="font-sans text-xs font-bold text-emerald-700">
            CNIS processado com sucesso! Os dados já estão disponíveis para criar ou atualizar os processos deste cliente.
          </p>
        </div>
      )}

      {cnis && isProcessing && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600" aria-hidden="true" />
          <p className="font-sans text-xs font-medium text-amber-700">
            Lendo o extrato do segurado. Você já pode criar processos, mas os cálculos que dependem do CNIS
            ficarão disponíveis assim que o processamento terminar.
          </p>
        </div>
      )}

      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : !cnis ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 text-center transition-all duration-300',
            isDragging ? 'border-amber-500 bg-amber-50/20' : 'border-slate-250 bg-slate-50/30 hover:border-slate-300'
          )}
        >
          <FileText className="mb-3 h-8 w-8 text-slate-350" aria-hidden="true" />
          <p className="mb-1 font-sans text-sm font-bold text-slate-700">Nenhum CNIS cadastrado</p>
          <p className="mb-1.5 max-w-md font-sans text-xs text-slate-500">
            Este extrato é a fonte única de dados do segurado: uma vez enviado, ele alimenta automaticamente
            os cálculos, simulações e retroativos de <strong>qualquer</strong> processo criado para este cliente
            (aposentadoria, BPC/LOAS, pensão etc.) — sem precisar reenviar o documento a cada novo caso.
          </p>
          <p className="mb-4 max-w-md font-sans text-[11px] text-slate-400">
            Envie o PDF abaixo para liberar a criação de casos com dados já preenchidos.
          </p>
          <Button
            variant="primary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-9 px-5 text-xs"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><Upload className="h-4 w-4" /> Selecionar PDF</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="min-w-0 space-y-1">
              <p className="font-sans text-sm font-bold text-slate-800">
                NIT: <span className="font-mono">{extractedData?.nit ?? '—'}</span>
              </p>
              <p className="font-sans text-xs text-slate-500">
                Atualizado em {formatDate(cnis.updatedAt)}
                {extractedData?.totalContribuicoes != null && ` · ${extractedData.totalContribuicoes} contribuições`}
              </p>
              {cnis.processingError && (
                <p className="font-sans text-xs font-semibold text-red-600">{cnis.processingError}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {cnis.downloadUrl && (
                <a
                  href={cnis.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 font-sans text-[10px] sm:text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" /> Baixar
                </a>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || isProcessing}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 font-sans text-[10px] sm:text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" /> Substituir
              </button>
              <button
                onClick={() => handleReprocess(() => {}, setActionError, setReprocessing)}
                disabled={reprocessing || isProcessing}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 font-sans text-[10px] sm:text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {reprocessing ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />} Reprocessar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 font-sans text-[10px] sm:text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={() => handleDelete(() => setShowDeleteConfirm(false), setActionError, setDeleting)}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Excluir CNIS?"
        message={
          caseCount > 1
            ? `Este CNIS é compartilhado por ${caseCount} processos deste cliente. Excluí-lo também apaga os cálculos, simulações e retroativos desses processos que dependem dele. Esta ação não pode ser desfeita.`
            : 'Esta ação exclui o CNIS e todos os cálculos, simulações e retroativos que dependem dele. Não pode ser desfeita.'
        }
        confirmLabel="Sim, Excluir"
        variant="danger"
        loading={deleting}
      />
    </Card>
  )
}
