'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

interface ActionItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface ActionsDropdownProps {
  actions: ActionItem[]
  ariaLabel?: string
}

export function ActionsDropdown({ actions, ariaLabel = 'Abrir menu de ações' }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); setOpen(!open) }}
        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden"
          role="menu"
          aria-label={ariaLabel}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left transition-colors ${
                action.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
              role="menuitem"
            >
              {action.icon ?? (
                action.variant === 'danger'
                  ? <Trash2 className="w-4 h-4" aria-hidden="true" />
                  : <Pencil className="w-4 h-4" aria-hidden="true" />
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
