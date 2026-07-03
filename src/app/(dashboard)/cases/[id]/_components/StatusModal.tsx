import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { STATUS_OPTIONS } from '../_constants'

interface Props {
  open: boolean
  newStatus: string
  loading: boolean
  onClose: () => void
  onStatusChange: (value: string) => void
  onConfirm: () => void
}

export function StatusModal({ open, newStatus, loading, onClose, onStatusChange, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Alterar Status do Caso">
      <div className="space-y-4">
        <div>
          <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Novo Status</label>
          <select
            value={newStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="neo-input"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <Button onClick={onConfirm} loading={loading} className="flex-1">
            Salvar
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
