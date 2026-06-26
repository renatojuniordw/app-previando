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
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-start gap-3 text-amber-850">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Persistência Definitiva</p>
            <p className="text-xs text-amber-700 mt-1">
              Essas alterações serão salvas diretamente no banco de dados e afetarão os cálculos, simulações, pareceres e checklists vinculados a este CNIS para este caso.
            </p>
          </div>
        </div>
        <p>Você tem certeza de que deseja persistir estas correções? Os cálculos automatizados baseados nesses salários e datas serão imediatamente atualizados de acordo com os novos dados fornecidos.</p>
        {saveError && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">{saveError}</div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onConfirm} disabled={saving} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-colors font-sans text-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando…</> : 'SIM, SALVAR'}
          </button>
          <button onClick={onClose} disabled={saving} className="flex-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-center transition-colors font-sans text-sm">
            CANCELAR
          </button>
        </div>
      </div>
    </Modal>
  )
}
