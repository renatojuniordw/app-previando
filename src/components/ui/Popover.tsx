'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PopoverProps {
  trigger: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  contentClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({
  trigger,
  children,
  position = 'bottom',
  className,
  contentClassName,
  open: controlledOpen,
  onOpenChange,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, setOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className={cn('relative inline-flex', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
      >
        {trigger}
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Popover de informação"
          className={cn(
            'absolute z-50 bg-white border border-slate-200 rounded-lg shadow-elevation-md p-4 min-w-[200px] max-w-[320px]',
            'animate-fade-in',
            positionClasses[position],
            contentClassName
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}
