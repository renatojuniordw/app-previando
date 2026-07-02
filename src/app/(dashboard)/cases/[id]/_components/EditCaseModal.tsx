import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { PRIORITY_OPTIONS } from '../_constants'
import type { CaseDetail } from '../_types'
import { formatCNJ, stripNonDigits } from '@/lib/masks'

interface Props {
  open: boolean
  caseData: CaseDetail | null
  loading: boolean
  onClose: () => void
  onSave: (data: { priority: string; deadlineDate: string; notes: string; processNumber: string }) => void
}

export function EditCaseModal({ open, caseData, loading, onClose, onSave }: Props) {
  const [priority, setPriority] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [notes, setNotes] = useState('')
  const [processNumber, setProcessNumber] = useState('')

  useEffect(() => {
    if (open && caseData) {
      setPriority(caseData.priority)
      setDeadlineDate(caseData.deadlineDate ? new Date(caseData.deadlineDate).toISOString().split('T')[0] : '')
      setNotes(caseData.notes || '')
      setProcessNumber(caseData.processNumber || '')
    }
  }, [open, caseData])

  const handleSave = () => {
    onSave({ priority, deadlineDate, notes, processNumber })
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Informações do Caso">
      <div className="space-y-4">
        <div>
          <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Prioridade</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <DatePicker
            label="Prazo (opcional)"
            value={deadlineDate}
            onChange={(d) => setDeadlineDate(d ? d.toISOString().split('T')[0] : '')}
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-slate-700 mb-1">
            Número do Processo (CNJ)
          </label>
          <input
            type="text"
            value={formatCNJ(processNumber)}
            onChange={(e) => setProcessNumber(stripNonDigits(e.target.value).slice(0, 20))}
            placeholder="0000000-00.0000.0.00.0000"
            maxLength={25}
            className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-slate-400">Formato CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO</p>
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Observações / Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent resize-y"
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
