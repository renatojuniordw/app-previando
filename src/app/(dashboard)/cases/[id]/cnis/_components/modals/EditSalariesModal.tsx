import { Plus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatCompetencia } from '../../_utils'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  salarios: Array<{ competencia: string; valor: number }>
  newCompetencia: string
  newValor: string
  onClose: () => void
  onSave: () => void
  onChangeCompetencia: (v: string) => void
  onChangeValor: (v: string) => void
  onAdd: () => void
  onRemove: (idx: number) => void
}

export function EditSalariesModal({
  open, salarios, newCompetencia, newValor,
  onClose, onSave, onChangeCompetencia, onChangeValor, onAdd, onRemove,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="GERENCIAR CONTRIBUIÇÕES / SALÁRIOS">
      <div className="space-y-4 font-sans text-sm">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h6 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Adicionar Salário de Contribuição</h6>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="new-competencia" className="text-xs font-semibold text-slate-600 block">Competência</label>
              <input
                id="new-competencia"
                type="text"
                value={newCompetencia}
                onChange={e => onChangeCompetencia(e.target.value)}
                placeholder="Ex: MM/YYYY ou YYYY-MM"
                className="w-full border border-slate-200 rounded-lg p-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <CurrencyInput
                value={newValor ? parseFloat(newValor) : ''}
                onChange={(val) => onChangeValor(String(val))}
                label="Valor do Salário (R$)"
                placeholder="Ex: 2.500,00"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Salário à Lista
          </button>
        </div>

        <div className="space-y-2">
          <h6 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Salários Registrados ({salarios.length})</h6>
          {salarios.length === 0 ? (
            <p className="text-slate-400 italic text-center py-4 text-xs">Nenhum salário cadastrado para este vínculo.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-200">
              {salarios.map((sal, sIdx) => (
                <div key={sIdx} className="px-4 py-2 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">{formatCompetencia(sal.competencia)}</span>
                    <span className="text-slate-500 text-[10px] ml-2">({sal.competencia})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700 text-xs tabular-nums">{formatCurrency(sal.valor)}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(sIdx)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                      title="Remover salário"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <button onClick={onSave} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-colors focus-visible:ring-2 focus-visible:ring-amber-500">
            Confirmar Salários
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-center transition-colors">
            Voltar
          </button>
        </div>
      </div>
    </Modal>
  )
}
