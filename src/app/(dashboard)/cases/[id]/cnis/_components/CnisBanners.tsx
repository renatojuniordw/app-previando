import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  isModified: boolean
  showSuccessBanner: boolean
  uploadError: string
  onSaveClick: () => void
  onDiscard: () => void
  onCloseSucess: () => void
}

export function CnisBanners({ isModified, showSuccessBanner, uploadError, onSaveClick, onDiscard, onCloseSucess }: Props) {
  return (
    <>
      {isModified && (
        <div className="border border-[#F0B09A] bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)] rounded-xl p-4 flex flex-column sm:flex-row align-items-center justify-content-between gap-4 animate-slide-down shadow-sm">
          <div className="flex align-items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <span className="font-sans text-sm font-semibold">
              Você fez alterações manuais nos dados do CNIS. Salve para atualizar definitivamente os cálculos e pareceres vinculados.
            </span>
          </div>
          <div className="flex align-items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onSaveClick}
              className="flex-1 sm:flex-initial neo-btn neo-btn-primary text-xs"
            >
              Salvar Alterações
            </button>
            <button
              onClick={onDiscard}
              className="flex-1 sm:flex-initial neo-btn-outline text-xs"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {showSuccessBanner && (
        <div className="border bg-emerald-50 text-emerald-800 rounded-xl p-4 flex align-items-center justify-content-between gap-3 animate-slide-down shadow-sm" aria-live="polite">
          <div className="flex align-items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-sans text-sm font-semibold">
              O CNIS foi processado e todos os dados foram extraídos com sucesso pela inteligência artificial!
            </span>
          </div>
          <button
            onClick={onCloseSucess}
            className="text-emerald-500 hover:text-emerald-700 font-sans text-xs font-bold uppercase transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            Fechar
          </button>
        </div>
      )}

      {uploadError && (
        <div className="border bg-red-50 rounded-xl p-4 flex align-items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="font-sans text-sm font-medium text-red-700">{uploadError}</p>
        </div>
      )}
    </>
  )
}
