'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Info, ChevronDown } from 'lucide-react'

interface HelpTextProps {
  title: string
  children: React.ReactNode
  className?: string
  defaultOpen?: boolean
  collapsible?: boolean
  variant?: 'default' | 'info'
}

const variantStyles = {
  default: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

export function HelpText({
  title,
  children,
  className,
  defaultOpen = true,
  collapsible = false,
  variant = 'default',
}: HelpTextProps) {
  const [open, setOpen] = useState(defaultOpen)

  const styles = variantStyles[variant]

  if (!collapsible && !open) return null

  return (
    <div className={cn('rounded-lg border p-4', styles, className)} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-sans font-semibold text-sm">{title}</h3>
            {collapsible && (
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="shrink-0 p-0.5 rounded transition-transform hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-label={open ? 'Recolher' : 'Expandir'}
                aria-expanded={open}
              >
                <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
              </button>
            )}
          </div>
          <div className={cn('font-sans text-sm leading-relaxed mt-1', open ? 'block' : 'hidden')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
