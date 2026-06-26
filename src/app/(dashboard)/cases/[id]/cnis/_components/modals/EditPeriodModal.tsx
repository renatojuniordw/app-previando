import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  empregador: string
  inicio: string
  fim: string
  isCurrent: boolean
  onClose: () => void
  onSave: () => void
  onChangeEmpregador: (v: string) => void
  onChangeInicio: (v: string) => void
  onChangeFim: (v: string) => void
  onChangeIsCurrent: (v: boolean) => void
}

export function EditPeriodModal({
  open, empregador, inicio, fim, isCurrent,
  onClose, onSave, onChangeEmpregador, onChangeInicio, onChangeFim, onChangeIsCurrent,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="EDITAR VÍNCULO EMPREGATÍCIO">
      <div className="space-y-4 font-sans text-sm">
        <div className="space-y-1">
          <label htmlFor="edit-empregador" className="font-bold text-slate-750 block">Nome do Empregador / Empresa</label>
          <input
            id="edit-empregador"
            type="text"
            value={empregador}
            onChange={e => onChangeEmpregador(e.target.value)}
            className="neo-input-neo text-sm"
            placeholder="Ex: Companhia de Alimentos S.A."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="edit-inicio" className="font-bold text-slate-750 block">Data de Início</label>
            <input
              id="edit-inicio"
              type="text"
              value={inicio}
              onChange={e => onChangeInicio(e.target.value)}
              className="neo-input-neo text-sm"
              placeholder="AAAA-MM-DD"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="edit-fim" className="font-bold text-slate-750 block">Data Fim</label>
            <input
              id="edit-fim"
              type="text"
              value={fim}
              onChange={e => onChangeFim(e.target.value)}
              disabled={isCurrent}
              className="neo-input-neo text-sm disabled:bg-[var(--color-card-inner)]"
              placeholder="AAAA-MM-DD"
            />
          </div>
        </div>

        <div className="flex align-items-center gap-2">
          <input
            id="edit-is-current"
            type="checkbox"
            checked={isCurrent}
            onChange={e => {
              onChangeIsCurrent(e.target.checked)
              if (e.target.checked) onChangeFim('')
            }}
            className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4"
          />
          <label htmlFor="edit-is-current" className="font-medium text-slate-650 cursor-pointer">Vínculo em andamento (Trabalho Ativo)</label>
        </div>

        <div className="flex gap-3 pt-3">
          <button onClick={onSave} className="flex-1 neo-btn neo-btn-primary flex-1 text-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            Aplicar Correções
          </button>
          <button onClick={onClose} className="flex-1 neo-btn-outline flex-1 text-center transition-colors">
            Voltar
          </button>
        </div>
      </div>
    </Modal>
  )
}
