'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { X } from 'lucide-react'

interface ContextualTooltipProps {
  content: string
  storageKey: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

/**
 * Exibe um tooltip de destaque uma única vez por usuário (armazenado em localStorage).
 * Usado no onboarding para destacar ações-chave na primeira visita.
 */
export function ContextualTooltip({
  content,
  storageKey,
  position = 'bottom',
  children,
}: ContextualTooltipProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(`tooltip_dismissed_${storageKey}`)
      if (!dismissed) setVisible(true)
    } catch {
      // localStorage não disponível — não mostrar
    }
  }, [storageKey])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(`tooltip_dismissed_${storageKey}`, '1')
    } catch {
      // ignore
    }
  }

  const positionClasses: Record<string, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-amber-400',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-amber-400',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-amber-400',
    right:
      'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-amber-400',
  }

  return (
    <div ref={ref} className="relative inline-block">
      {children}
      {visible && (
        <div
          role="tooltip"
          id={id}
          className={`absolute z-50 w-56 ${positionClasses[position]} pointer-events-auto`}
        >
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            aria-hidden="true"
          />
          {/* Bubble */}
          <div className="bg-amber-400 text-amber-900 text-xs font-sans font-medium rounded-lg px-3 py-2 shadow-lg relative">
            <div className="flex items-start justify-between gap-2">
              <span className="leading-relaxed">{content}</span>
              <button
                onClick={dismiss}
                aria-label="Fechar dica"
                className="shrink-0 mt-0.5 text-amber-700 hover:text-amber-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
