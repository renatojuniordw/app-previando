'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef)
  useBodyScrollLock(open)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'bg-white text-slate-900 border border-slate-200 w-full flex flex-col',
          'max-h-[100dvh] sm:max-h-[85dvh]',
          'rounded-t-2xl sm:rounded-lg',
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 id="modal-title" className="font-serif font-bold text-lg text-slate-900 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg min-w-[44px] min-h-[44px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
