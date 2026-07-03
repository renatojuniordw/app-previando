'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ExternalLink, FileText } from 'lucide-react'
import { useCnis } from './_hooks/useCnis'
import { useCnisUpload } from './_hooks/useCnisUpload'
import { useCnisEditing } from './_hooks/useCnisEditing'
import { isProcessingStatus } from './_constants'
import { CnisHeader } from './_components/CnisHeader'
import { CnisBanners } from './_components/CnisBanners'
import { CnisUploadOverlay } from './_components/CnisUploadOverlay'
import { CnisUploadDropzone } from './_components/CnisUploadDropzone'
import { CnisStatusCard } from './_components/CnisStatusCard'
import { DeleteModal } from './_components/modals/DeleteModal'
import { SaveConfirmModal } from './_components/modals/SaveConfirmModal'
import { ReprocessModal } from './_components/modals/ReprocessModal'
import { EditPeriodModal } from './_components/modals/EditPeriodModal'
import { EditSalariesModal } from './_components/modals/EditSalariesModal'
import { CnisIndicatorsDrawer } from './_components/CnisIndicatorsDrawer'

export default function CnisCasePage() {
  const params = useParams()
  const caseId = params.id as string

  const { cnis, setCnis, loading, showSuccessBanner, setShowSuccessBanner, stuckWarning, load, handleDelete, handleReprocess } = useCnis(caseId)
  const { uploading, uploadError, isDragging, fileRef, handleUpload, handleDragOver, handleDragLeave, handleDrop } = useCnisUpload(caseId, load)
  const editing = useCnisEditing(cnis, setCnis)

  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const showIndicatorsDrawer = searchParams.get('drawer') === 'dictionary'

  const openDictionary = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set('drawer', 'dictionary')
    router.replace(`${pathname}?${next.toString()}`)
  }

  const closeDictionary = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('drawer')
    router.replace(`${pathname}?${next.toString()}`)
  }

  useEffect(() => {
    if (!cnis?.downloadUrl) return
    let revoked = false
    fetch(cnis.downloadUrl)
      .then(r => r.blob())
      .then(blob => {
        if (!revoked) setPdfBlobUrl(URL.createObjectURL(blob))
      })
      .catch(err => { console.error('[PDF blob]', err); setPdfBlobUrl(null) })
    return () => {
      revoked = true
      setPdfBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    }
  }, [cnis?.downloadUrl])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showReprocessModal, setShowReprocessModal] = useState(false)
  const [reprocessing, setReprocessing] = useState(false)
  const [reprocessError, setReprocessError] = useState('')

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
        <p className="font-sans font-medium text-slate-500 animate-pulse mt-4">Carregando CNIS…</p>
      </div>
    )
  }

  const isProcessing = cnis ? isProcessingStatus(cnis.processingStatus) : false

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative px-4 sm:px-6">
      {uploading && <CnisUploadOverlay />}

      <CnisHeader
        hasCnis={!!cnis}
        downloadUrl={cnis?.downloadUrl}
        showPdfViewer={showPdfViewer}
        uploading={uploading}
        isProcessing={isProcessing}
        deleting={deleting}
        processingStatus={cnis?.processingStatus}
        onTogglePdf={() => setShowPdfViewer(v => !v)}
        onDeleteClick={() => setShowDeleteModal(true)}
        onUploadClick={() => fileRef.current?.click()}
        fileRef={fileRef}
        onFileChange={handleUpload}
        onOpenDictionary={openDictionary}
      />

      <CnisBanners
        isModified={editing.isModified}
        showSuccessBanner={showSuccessBanner}
        uploadError={uploadError}
        onSaveClick={() => editing.setShowSaveConfirmModal(true)}
        onDiscard={editing.discardChanges}
        onCloseSucess={() => setShowSuccessBanner(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {showPdfViewer && cnis?.downloadUrl && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-6 z-10 hidden lg:flex flex-col h-[calc(100vh-6rem)]">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <span className="font-sans font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Documento CNIS Original
              </span>
              <div className="flex items-center gap-2">
                <a href={cnis.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none">
                  <ExternalLink className="w-3 h-3" />
                  Nova Aba
                </a>
                <button onClick={() => setShowPdfViewer(false)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none">
                  Ocultar
                </button>
              </div>
            </div>
            <iframe src={pdfBlobUrl ?? ''} className="w-full grow border-0 bg-slate-100" title="Extrato CNIS Original" />
          </div>
        )}

        <div className={`${showPdfViewer && cnis?.downloadUrl ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6 w-full`}>
          {!cnis ? (
            <CnisUploadDropzone
              isDragging={isDragging}
              uploading={uploading}
              isProcessing={isProcessing}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onUploadClick={() => fileRef.current?.click()}
            />
          ) : (
            <CnisStatusCard
              cnis={cnis}
              isProcessing={isProcessing}
              stuckWarning={stuckWarning}
              tempExtractedData={editing.tempExtractedData}
              onReprocessClick={() => setShowReprocessModal(true)}
              onUploadClick={() => fileRef.current?.click()}
              onEditField={editing.editField}
              onExportCSV={editing.handleExportCSV}
              onAddPeriod={editing.addPeriod}
              onEditPeriod={editing.openEditPeriod}
              onEditSalaries={editing.openEditSalaries}
              onDeletePeriod={editing.deletePeriodLocal}
            />
          )}
        </div>
      </div>

      <DeleteModal
        open={showDeleteModal}
        deleting={deleting}
        deleteError={deleteError}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleDelete(() => setShowDeleteModal(false), setDeleteError, setDeleting)}
      />

      <SaveConfirmModal
        open={editing.showSaveConfirmModal}
        saving={editing.savingData}
        saveError={editing.saveError}
        onClose={() => editing.setShowSaveConfirmModal(false)}
        onConfirm={() => editing.handleSaveToDb(caseId)}
      />

      <ReprocessModal
        open={showReprocessModal}
        reprocessing={reprocessing}
        reprocessError={reprocessError}
        onClose={() => setShowReprocessModal(false)}
        onConfirm={() => handleReprocess(() => setShowReprocessModal(false), setReprocessError, setReprocessing)}
      />

      <EditPeriodModal
        open={editing.showEditPeriodModal}
        empregador={editing.editEmpregador}
        inicio={editing.editInicio}
        fim={editing.editFim}
        isCurrent={editing.editIsCurrent}
        onClose={() => editing.setShowEditPeriodModal(false)}
        onSave={editing.savePeriod}
        onChangeEmpregador={editing.setEditEmpregador}
        onChangeInicio={editing.setEditInicio}
        onChangeFim={editing.setEditFim}
        onChangeIsCurrent={editing.setEditIsCurrent}
      />

      <EditSalariesModal
        open={editing.showEditSalariesModal}
        salarios={editing.editSalarios}
        newCompetencia={editing.newCompetencia}
        newValor={editing.newValor}
        onClose={() => editing.setShowEditSalariesModal(false)}
        onSave={editing.saveSalaries}
        onChangeCompetencia={editing.setNewCompetencia}
        onChangeValor={editing.setNewValor}
        onAdd={editing.addSalaryItem}
        onRemove={editing.removeSalaryItem}
      />

      <CnisIndicatorsDrawer
        open={showIndicatorsDrawer}
        onClose={closeDictionary}
      />
    </div>
  )
}
