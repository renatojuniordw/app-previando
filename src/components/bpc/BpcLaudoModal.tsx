'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface BpcLaudoModalProps {
  open: boolean
  onClose: () => void
  onAnalyze: (laudoText: string) => Promise<void>
}

export function BpcLaudoModal({ open, onClose, onAnalyze }: BpcLaudoModalProps) {
  const [laudoText, setLaudoText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!laudoText.trim()) return
    setLoading(true)
    try {
      await onAnalyze(laudoText)
      setLaudoText('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Analisar Laudo Médico">
      <div className="space-y-4 font-sans">
        <div>
          <label className="neo-label">Cole o texto do laudo aqui</label>
          <textarea
            value={laudoText}
            onChange={(e) => setLaudoText(e.target.value)}
            className="w-full neo-input-neo min-h-[200px] resize-none font-sans text-sm focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            placeholder="Cole o texto do laudo médico aqui (não precisa formatar)..."
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleAnalyze}
            loading={loading}
            disabled={!laudoText.trim()}
            className="flex-1"
          >
            Analisar
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
