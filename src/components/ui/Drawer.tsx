'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
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
    <div className="fixed inset-0 z-50 flex justify-content-end" role="dialog" aria-modal="true">
      {/* Backdrop with fade-in and blur */}
      <div
        className="fixed inset-0 backdrop-blur-xs transition-opacity duration-300 ease-out animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content sliding in from right */}
      <div
        ref={drawerRef}
        className={cn(
          'relative w-full max-w-md md:max-w-xl h-full flex flex-column z-10 animate-slide-in neo-card',
          className
        )}
        
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex align-items-start justify-content-between gap-4"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="space-y-1">
            <h2 className="font-serif font-bold text-lg tracking-tight leading-none" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h2>
            {description && (
              <p className="font-sans text-xs leading-normal" style={{ color: 'var(--color-text-muted)' }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Fechar gaveta"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-card-inner)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent' }}
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
