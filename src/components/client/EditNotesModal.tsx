'use client'

import { useEffect, useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const MAX_NOTES = 2000

interface Props {
  open: boolean
  initialNotes: string
  onClose: () => void
  onSave: (notes: string) => Promise<void>
}

export function EditNotesModal({ open, initialNotes, onClose, onSave }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const initialRef = useRef(initialNotes)

  useEffect(() => {
    if (open) {
      setNotes(initialNotes)
      initialRef.current = initialNotes
    }
  }, [open, initialNotes])

  const isDirty = notes !== initialRef.current

  const handleClose = () => {
    if (isDirty && !window.confirm('Há alterações não salvas. Deseja realmente sair?')) return
    onClose()
  }

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

  const charsLeft = MAX_NOTES - notes.length
  const nearLimit = charsLeft <= 50

  return (
    <Modal open={open} onClose={handleClose} title="Editar Observações">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[140px] resize-none"
            placeholder="Digite observações importantes sobre este cliente..."
            aria-describedby="notes-counter"
          />
          <div
            id="notes-counter"
            className={cn(
              'mt-1 text-right font-mono text-xs font-medium transition-colors',
              nearLimit ? 'text-amber-600' : 'text-slate-400'
            )}
          >
            {notes.length}/{MAX_NOTES}
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1 font-sans font-bold text-xs h-10">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-1 bg-slate-900 hover:bg-slate-850 border-slate-900 font-sans font-bold text-xs h-10 shadow-sm text-white">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
