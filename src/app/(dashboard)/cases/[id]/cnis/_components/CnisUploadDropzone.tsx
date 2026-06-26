import { FileText, Loader2, Upload } from 'lucide-react'

interface Props {
  isDragging: boolean
  uploading: boolean
  isProcessing: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onUploadClick: () => void
}

export function CnisUploadDropzone({ isDragging, uploading, isProcessing, onDragOver, onDragLeave, onDrop, onUploadClick }: Props) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`py-20 flex flex-column align-items-center justify-content-center border-2 border-dashed rounded-2xl text-center transition-all duration-200 ${
        isDragging
          ? 'border-[var(--color-primary)] bg-[rgba(242,232,228,0.5)] scale-[0.99] shadow-inner'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80'
      }`}
    >
      <div className="w-16 h-16 rounded-full bg-[var(--color-card-bg)] flex align-items-center justify-content-center mb-4 border border-[var(--color-border)] shadow-sm">
        <FileText className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhum CNIS Enviado</h3>
      <p className="font-sans text-sm text-slate-500 mb-6 max-w-md mx-auto px-4">
        Arraste e solte o extrato do CNIS em formato PDF aqui ou selecione de seu computador. O sistema extrairá os vínculos e salários automaticamente.
      </p>
      <button
        onClick={onUploadClick}
        disabled={uploading || isProcessing}
        className="neo-btn neo-btn-primary text-sm flex align-items-center gap-2 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Enviando Arquivo…</>
        ) : (
          <><Upload className="w-4 h-4" />Selecionar Arquivo PDF</>
        )}
      </button>
    </div>
  )
}
