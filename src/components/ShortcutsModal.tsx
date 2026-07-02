'use client'

import { useEffect, useRef } from 'react'
import { Keyboard, X } from 'lucide-react'
import { SHORTCUTS_LIST } from '@/hooks/useKeyboardShortcuts'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ShortcutsModalProps {
  open: boolean
  onClose: () => void
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Atalhos de teclado"
    >
      <div
        ref={dialogRef}
        className="bg-white text-slate-900 border border-slate-200 rounded-lg shadow-elevation-md max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <h2 className="font-serif font-bold text-xl text-slate-900">Atalhos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-slate-400" aria-hidden="true" />
          </button>
        </div>

        <p className="font-sans text-sm text-slate-500 mb-4">
          Pressione os atalhos abaixo para navegar rapidamente pelo Previando.
        </p>

        <div className="space-y-2" role="list">
          {SHORTCUTS_LIST.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50"
              role="listitem"
            >
              <span className="font-sans text-sm text-slate-700">{shortcut.description}</span>
              <kbd className="font-mono text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 text-slate-600 shadow-sm">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        <p className="font-sans text-xs text-slate-400 mt-4 text-center">
          Pressione <kbd className="font-mono bg-slate-100 rounded px-1">?</kbd> a qualquer momento para abrir esta janela
        </p>
      </div>
    </div>
  )
}
