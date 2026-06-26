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
      className={`py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl text-center transition-all duration-200 ${
        isDragging
          ? 'border-amber-500 bg-amber-50/50 scale-[0.99] shadow-inner'
          : 'border-slate-300 bg-slate-50 hover:bg-slate-50/80 hover:border-slate-400'
      }`}
    >
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
        <FileText className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhum CNIS Enviado</h3>
      <p className="font-sans text-sm text-slate-500 mb-6 max-w-md mx-auto px-4">
        Arraste e solte o extrato do CNIS em formato PDF aqui ou selecione de seu computador. O sistema extrairá os vínculos e salários automaticamente.
      </p>
      <button
        onClick={onUploadClick}
        disabled={uploading || isProcessing}
        className="bg-amber-600 text-white font-sans font-semibold text-sm px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
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
