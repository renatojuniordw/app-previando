'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface FloatingAction {
  id: string
  label: string
  icon: ReactNode
  color?: string
  activeColor?: string
  onClick: () => void
  isActive?: boolean
  show?: boolean
}

interface FloatingActionMenuProps {
  actions: FloatingAction[]
  /** Cor do botão principal quando fechado */
  triggerColor?: string
  /** Cor do botão principal quando aberto */
  triggerOpenColor?: string
  /** Ícone do botão principal quando fechado */
  triggerIcon: ReactNode
  /** aria-label do botão principal */
  triggerLabel?: string
  /** Hint tooltip (opcional) */
  hintText?: string
  hintDelay?: number
  hintDuration?: number
}

export function FloatingActionMenu({
  actions,
  triggerColor = 'bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/20',
  triggerOpenColor = 'bg-slate-800 hover:bg-slate-700',
  triggerIcon,
  triggerLabel = 'Abrir menu de ações rápidas',
  hintText,
  hintDelay = 2500,
  hintDuration = 5000,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hasInteractedRef = useRef(false)

  const filteredActions = actions.filter((a) => a.show !== false)

  // Hint tooltip on fresh pages
  useEffect(() => {
    if (!hintText || hasInteractedRef.current) return
    const show = setTimeout(() => setShowHint(true), hintDelay)
    const hide = setTimeout(() => setShowHint(false), hintDelay + hintDuration)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [hintText, hintDelay, hintDuration])

  // Click outside + Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleToggle = () => {
    hasInteractedRef.current = true
    setShowHint(false)
    setIsOpen(!isOpen)
  }

  const handleAction = (action: FloatingAction) => {
    hasInteractedRef.current = true
    setShowHint(false)
    action.onClick()
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="fixed bottom-[5rem] right-4 z-[60] flex flex-col items-end gap-2 sm:right-6 lg:bottom-6">
      {/* Sub-buttons */}
      <div
        className={cn(
          'flex flex-col items-end gap-2 transition-all duration-300 ease-out origin-bottom transform',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-75 pointer-events-none invisible'
        )}
      >
        {filteredActions.map((action, index) => {
          return (
            <div key={action.id} className="flex items-center gap-2 group">
              <span
                className={cn(
                  'px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-sans font-semibold shadow-md whitespace-nowrap transition-all duration-200 origin-right',
                  isOpen
                    ? 'opacity-100 scale-100 translate-x-0 lg:opacity-0 lg:scale-95 lg:translate-x-2 lg:group-hover:opacity-100 lg:group-hover:scale-100 lg:group-hover:translate-x-0'
                    : 'opacity-0 scale-95 translate-x-2'
                )}
              >
                {action.label}
              </span>
              <button
                onClick={() => handleAction(action)}
                className={cn(
                  'w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center transition-all duration-200 pointer-events-auto',
                  action.isActive
                    ? (action.activeColor ?? 'border-amber-500 text-amber-600 bg-amber-50/30')
                    : (action.color ?? 'text-slate-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50'),
                )}
                aria-label={action.label}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                }}
              >
                {action.icon}
              </button>
            </div>
          )
        })}
      </div>

      {/* Hint tooltip */}
      {showHint && hintText && (
        <div className="animate-hint-fade bg-slate-900 text-white text-[10px] font-sans font-semibold px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 whitespace-nowrap mb-1 pointer-events-auto">
          {hintText}
        </div>
      )}

      {/* Trigger */}
      <div className="relative pointer-events-auto">
        <button
          onClick={handleToggle}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center shadow-xl text-white transition-all duration-300 transform active:scale-95',
            isOpen
              ? `${triggerOpenColor} rotate-90 scale-95`
              : `${triggerColor} hover:scale-105`
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={triggerLabel}
        >
          {isOpen ? (
            <X className="w-5 h-5 animate-fade-in" aria-hidden="true" />
          ) : (
            triggerIcon
          )}
        </button>
      </div>
    </div>
  )
}
