'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function BottomSheet({ open, onClose, children, title, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useFocusTrap(open, sheetRef)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={title ? 'bottom-sheet-title' : undefined}>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        tabIndex={-1}
        className={cn(
          'fixed bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] animate-slide-up',
          className
        )}
      >
        <div className="shrink-0 flex flex-col items-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {(title) && (
          <div className="flex items-center justify-between px-5 pb-4 mb-2 border-b border-slate-100">
            <h3 id="bottom-sheet-title" className="font-serif font-bold text-lg text-slate-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-lg min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
