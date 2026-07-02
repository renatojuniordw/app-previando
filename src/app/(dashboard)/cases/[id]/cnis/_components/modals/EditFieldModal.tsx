import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  label: string
  currentValue: string
  onClose: () => void
  onSave: (value: string) => void
}

export function EditFieldModal({ open, label, currentValue, onClose, onSave }: Props) {
  const [value, setValue] = useState(currentValue)

  return (
    <Modal open={open} onClose={onClose} title={`EDITAR ${label.toUpperCase()}`}>
      <div className="space-y-4 font-sans text-sm">
        <div className="space-y-1">
          <label htmlFor="edit-field" className="font-bold text-slate-750 block">{label}</label>
          <input
            id="edit-field"
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
            autoFocus
          />
        </div>

        <div className="flex gap-3 pt-3">
          <button
            onClick={() => onSave(value)}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-center transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
