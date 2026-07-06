'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  initialNotes: string
  onClose: () => void
  onSave: (notes: string) => Promise<void>
}

export function EditNotesModal({ open, initialNotes, onClose, onSave }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setNotes(initialNotes)
  }, [open, initialNotes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(notes)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Observações"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[140px] resize-none"
            placeholder="Digite observações importantes sobre este cliente..."
          />
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-sans font-bold text-xs h-10">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1 bg-slate-900 hover:bg-slate-850 border-slate-900 font-sans font-bold text-xs h-10 shadow-sm text-white">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
