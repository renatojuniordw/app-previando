import { Eye, EyeOff, ExternalLink, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
  hasCnis,
  downloadUrl,
  showPdfViewer,
  fileRef,
  onTogglePdf,
  onFileChange,
  onOpenDictionary,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <h1 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 tracking-tight leading-none">Extrato do CNIS</h1>
        <p className="font-sans text-xs text-slate-500 mt-2 font-medium leading-relaxed">
          Gerencie, analise e corrija os vínculos e salários extraídos automaticamente do segurado.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />

        {hasCnis && downloadUrl && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePdf}
              className="hidden lg:inline-flex"
              aria-label={showPdfViewer ? 'Ocultar PDF original' : 'Exibir PDF original lado a lado'}
            >
              {showPdfViewer ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
              <span>{showPdfViewer ? 'Ocultar PDF' : 'Ver PDF Lado a Lado'}</span>
            </Button>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex lg:hidden items-center justify-center gap-2 font-sans font-medium border rounded-md transition-colors duration-200 bg-white text-slate-900 border-slate-300 hover:bg-slate-50 px-3 py-1.5 text-xs shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Abrir PDF Original</span>
            </a>
          </>
        )}

        {hasCnis && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDictionary}
            title="Dicionário de Indicadores"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Dicionário</span>
          </Button>
        )}
      </div>
    </div>
  )
}
