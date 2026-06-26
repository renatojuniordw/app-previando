import { AlertCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  reprocessing: boolean
  reprocessError: string
  onClose: () => void
  onConfirm: () => void
}

export function ReprocessModal({ open, reprocessing, reprocessError, onClose, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="REPROCESSAR EXTRATO DO CNIS?">
      <div className="space-y-4 font-sans text-sm text-slate-600 leading-relaxed">
        <div className="bg-[var(--color-primary-tint)] rounded-xl p-4 flex align-items-start gap-3 text-[#A03A15]">
          <AlertCircle className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Fila de Execução em Nuvem</p>
            <p className="text-xs text-[var(--color-primary-dark)] mt-1">
              O sistema utilizará o arquivo PDF já guardado na nuvem para realizar um novo processamento completo da IA. Isso evitará consumo extra de banda e redundância de arquivos.
            </p>
          </div>
        </div>
        <p>Deseja colocar novamente o documento na fila de extração em background?</p>
        {reprocessError && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">{reprocessError}</div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onConfirm} disabled={reprocessing} className="flex-1 neo-btn neo-btn-primary flex-1 text-center transition-colors font-sans text-sm flex align-items-center justify-content-center gap-2 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            {reprocessing ? <><Loader2 className="w-4 h-4 animate-spin" />Reprocessando…</> : 'SIM, REPROCESSAR'}
          </button>
          <button onClick={onClose} disabled={reprocessing} className="flex-1 neo-btn-outline flex-1 text-center transition-colors font-sans text-sm">
            CANCELAR
          </button>
        </div>
      </div>
    </Modal>
  )
}
