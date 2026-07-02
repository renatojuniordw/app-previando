'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onClose, title, description, children, className }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useFocusTrap(open, drawerRef)

  // Esc key closure
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
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      {/* Backdrop with fade-in and blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-out animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content sliding in from right */}
      <div
        ref={drawerRef}
        className={cn(
          'relative w-full max-w-md md:max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-slide-in',
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id="drawer-title" className="font-serif font-bold text-lg text-slate-900 tracking-tight leading-none">
              {title}
            </h2>
            {description && (
              <p className="font-sans text-xs text-slate-500 leading-normal">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Fechar gaveta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area with scroll */}
        <div className="flex-1 overflow-y-auto p-6 neo-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}
