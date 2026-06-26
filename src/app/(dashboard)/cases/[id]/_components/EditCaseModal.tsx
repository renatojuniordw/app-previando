import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PRIORITY_OPTIONS } from '../_constants'
import type { CaseDetail } from '../_types'

interface Props {
  open: boolean
  caseData: CaseDetail | null
  loading: boolean
  onClose: () => void
  onSave: (data: { priority: string; deadlineDate: string; notes: string }) => void
}

export function EditCaseModal({ open, caseData, loading, onClose, onSave }: Props) {
  const [priority, setPriority] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open && caseData) {
      setPriority(caseData.priority)
      setDeadlineDate(caseData.deadlineDate ? new Date(caseData.deadlineDate).toISOString().split('T')[0] : '')
      setNotes(caseData.notes || '')
    }
  }, [open, caseData])

  const handleSave = () => {
    onSave({ priority, deadlineDate, notes })
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Informações do Caso">
      <div className="space-y-4">
        <div>
          <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Prioridade</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 font-sans text-sm rounded-md neo-input-neo"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Prazo (opcional)</label>
          <input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            className="w-full px-3 py-2 font-sans text-sm rounded-md neo-input-neo"
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Observações / Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 font-sans text-sm rounded-md neo-input-neo resize-y"
            placeholder="Adicione notas importantes sobre este caso..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} loading={loading} className="flex-1">
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
