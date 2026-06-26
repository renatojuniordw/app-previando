import { Eye, EyeOff, Loader2, Trash2, Upload, ExternalLink, BookOpen } from 'lucide-react'

interface Props {
  hasCnis: boolean
  downloadUrl?: string | null
  showPdfViewer: boolean
  uploading: boolean
  isProcessing: boolean
  deleting: boolean
  processingStatus?: string
  onTogglePdf: () => void
  onDeleteClick: () => void
  onUploadClick: () => void
  fileRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenDictionary: () => void
}

export function CnisHeader({
  hasCnis, downloadUrl, showPdfViewer, uploading, isProcessing, deleting,
  processingStatus, onTogglePdf, onDeleteClick, onUploadClick, fileRef, onFileChange,
  onOpenDictionary,
}: Props) {
  const showUploadButton = !hasCnis || processingStatus === 'FAILED'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Extrato do CNIS</h2>
        <p className="font-sans text-sm text-slate-500 mt-1">Gerencie, analise e corrija os vínculos e salários extraídos do segurado.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />

        {hasCnis && downloadUrl && (
          <>
            <button
              onClick={onTogglePdf}
              className="hidden lg:flex border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              aria-label={showPdfViewer ? 'Ocultar PDF original' : 'Exibir PDF original lado a lado'}
            >
              {showPdfViewer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPdfViewer ? 'Ocultar PDF' : 'Ver PDF Lado a Lado'}
            </button>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex lg:hidden border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir PDF Original
            </a>
          </>
        )}

        {hasCnis && (
          <button
            type="button"
            onClick={onOpenDictionary}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            title="Dicionário de Indicadores"
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            Dicionário
          </button>
        )}

        {hasCnis && (
          <button
            onClick={onDeleteClick}
            disabled={uploading || deleting}
            className="border border-red-200 text-red-600 hover:bg-red-50 font-sans font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Excluir CNIS
          </button>
        )}

        {showUploadButton && (
          <button
            onClick={onUploadClick}
            disabled={uploading || isProcessing || deleting}
            className="bg-amber-600 text-white font-sans font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Enviando…</>
            ) : (
              <><Upload className="w-4 h-4" />Enviar Novo CNIS (PDF)</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
