import { AlertCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  saving: boolean
  saveError: string
  onClose: () => void
  onConfirm: () => void
}

export function SaveConfirmModal({ open, saving, saveError, onClose, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="SALVAR ALTERAÇÕES NO CNIS?">
      <div className="space-y-4 font-sans text-sm text-slate-600 leading-relaxed">
        <div className="border border-[#F0B09A] bg-[var(--color-primary-tint)] rounded-xl p-4 flex align-items-start gap-3 text-amber-850">
          <AlertCircle className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Persistência Definitiva</p>
            <p className="text-xs text-[var(--color-primary-dark)] mt-1">
              Essas alterações serão salvas diretamente no banco de dados e afetarão os cálculos, simulações, pareceres e checklists vinculados a este CNIS para este caso.
            </p>
          </div>
        </div>
        <p>Você tem certeza de que deseja persistir estas correções? Os cálculos automatizados baseados nesses salários e datas serão imediatamente atualizados de acordo com os novos dados fornecidos.</p>
        {saveError && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">{saveError}</div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onConfirm} disabled={saving} className="flex-1 neo-btn neo-btn-primary flex-1 text-center transition-colors font-sans text-sm flex align-items-center justify-content-center gap-2 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando…</> : 'SIM, SALVAR'}
          </button>
          <button onClick={onClose} disabled={saving} className="flex-1 neo-btn-outline flex-1 text-center transition-colors font-sans text-sm">
            CANCELAR
          </button>
        </div>
      </div>
    </Modal>
  )
}
