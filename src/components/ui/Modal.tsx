'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

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
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex align-items-center justify-content-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={cn('bg-white text-slate-900 rounded-lg w-full p-0 overflow-hidden neo-card-flat', sizes[size], className)}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex align-items-center justify-content-between px-6 py-4" style={{background:'var(--color-surface)',borderBottom:'1px solid var(--color-border)'}}>
          <h2 className="font-serif font-bold text-lg text-slate-900 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="font-sans text-slate-500 hover:text-slate-900 text-lg leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
