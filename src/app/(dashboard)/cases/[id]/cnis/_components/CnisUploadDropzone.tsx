import { FileText, Loader2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Props {
  isDragging: boolean
  uploading: boolean
  isProcessing: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onUploadClick: () => void
}

export function CnisUploadDropzone({ isDragging, uploading, isProcessing, onDragOver, onDragLeave, onDrop, onUploadClick }: Props) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUploadClick() }}
      role="button"
      tabIndex={0}
      aria-label="Área para upload do CNIS. Arraste um arquivo PDF ou pressione Enter para selecionar."
      className={cn(
        "py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl text-center transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none",
        isDragging
          ? 'border-amber-500 bg-amber-50/20 scale-[0.99] shadow-inner'
          : 'border-slate-300 bg-white hover:bg-slate-50/50 hover:border-slate-300 shadow-sm'
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-5 shadow-sm text-slate-500">
        <FileText className="w-8 h-8" />
      </div>
      <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">Nenhum CNIS Enviado</h3>
      <p className="font-sans text-sm text-slate-500 mb-7 max-w-md mx-auto px-6 leading-relaxed font-medium">
        Arraste e solte o extrato do CNIS em formato PDF aqui ou selecione do seu computador. Nossa IA extrairá os vínculos e salários automaticamente.
      </p>
      <Button
        variant="primary"
        onClick={onUploadClick}
        disabled={uploading || isProcessing}
        className="h-10 px-6"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /><span>Enviando Arquivo…</span></>
        ) : (
          <><Upload className="w-4 h-4" /><span>Selecionar Arquivo PDF</span></>
        )}
      </Button>
    </div>
  )
}
