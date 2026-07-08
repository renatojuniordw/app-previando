'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useCnis } from '@/hooks/useCnis'
import { useCnisUpload } from '@/hooks/useCnisUpload'
import { useCnisEditing } from './_hooks/useCnisEditing'
import { isProcessingStatus } from '@/lib/cnis-status'
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
import { Drawer } from '@/components/ui/Drawer'

export default function CnisCasePage() {
  const params = useParams()
  const caseId = params.id as string

  // O CNIS pertence ao cliente (1 por segurado), não ao caso — resolve o clientId
  // do caso atual antes de carregar/operar o CNIS.
  const [clientId, setClientId] = useState('')
  useEffect(() => {
    api.get(`/cases/${caseId}`)
      .then((r) => setClientId(r.data.case?.client?.id ?? ''))
      .catch(() => setClientId(''))
  }, [caseId])

  const { cnis, setCnis, loading, showSuccessBanner, setShowSuccessBanner, stuckWarning, load, handleDelete, handleReprocess } = useCnis(clientId)
  const { uploading, uploadError, isDragging, fileRef, handleUpload, handleDragOver, handleDragLeave, handleDrop } = useCnisUpload(clientId, load)
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
    <ErrorBoundary>
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

      <div className="w-full">
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
            onDeleteCnisClick={() => setShowDeleteModal(true)}
            onEditField={editing.editField}
            onExportCSV={editing.handleExportCSV}
            onAddPeriod={editing.addPeriod}
            onEditPeriod={editing.openEditPeriod}
            onEditSalaries={editing.openEditSalaries}
            onDeletePeriod={editing.deletePeriodLocal}
          />
        )}
      </div>

      <Drawer
        open={showPdfViewer && !!cnis?.downloadUrl}
        onClose={() => setShowPdfViewer(false)}
        title="Documento CNIS Original"
        description="Compare as informações cadastradas com a visualização do arquivo original"
        className="max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
      >
        <div className="flex flex-col h-full -m-6 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-end shrink-0">
            <a
              href={cnis?.downloadUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded border border-amber-250 bg-amber-50/50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 focus-visible:outline-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir em Nova Aba
            </a>
          </div>
          <iframe
            src={pdfBlobUrl ?? ''}
            className="w-full grow border-0 bg-slate-100 min-h-[calc(100dvh-12rem)]"
            title="Extrato CNIS Original"
          />
        </div>
      </Drawer>

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
        onConfirm={() => editing.handleSaveToDb(clientId)}
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
    </ErrorBoundary>
  )
}
