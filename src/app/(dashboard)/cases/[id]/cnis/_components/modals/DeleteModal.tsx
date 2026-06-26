import { AlertCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  deleting: boolean
  deleteError: string
  onClose: () => void
  onConfirm: () => void
}

export function DeleteModal({ open, deleting, deleteError, onClose, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="EXCLUIR EXTRATO DO CNIS?">
      <div className="space-y-4 font-sans text-sm text-slate-600 leading-relaxed">
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Atenção: Ação Irreversível!</p>
            <p className="text-xs text-red-700 mt-1">
              Ao excluir o CNIS deste caso, todos os cálculos, simulações, retroativos, checklists e pareceres vinculados a ele serão <strong>excluídos permanentemente</strong> do banco de dados e precisarão ser refeitos.
            </p>
          </div>
        </div>
        <p>Os cálculos e relatórios gerados dependem dos dados desse extrato do CNIS. Sem ele, essas informações perdem a sua origem de dados no sistema.</p>
        {deleteError && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">{deleteError}</div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onConfirm} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-colors font-sans text-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-red-500">
            {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Excluindo…</> : 'SIM, EXCLUIR TUDO'}
          </button>
          <button onClick={onClose} disabled={deleting} className="flex-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-center transition-colors font-sans text-sm">
            CANCELAR
          </button>
        </div>
      </div>
    </Modal>
  )
}
