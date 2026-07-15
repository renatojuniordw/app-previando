'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { ContextualTooltip } from '@/components/onboarding/ContextualTooltip'

interface ActionItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface ActionsDropdownProps {
  actions: ActionItem[]
  ariaLabel?: string
  showFirstVisitHint?: boolean
}

const FIRST_VISIT_HINT_STORAGE_KEY = 'actions_menu'

export function ActionsDropdown({ actions, ariaLabel = 'Abrir menu de ações', showFirstVisitHint = false }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [hintAlreadySeen, setHintAlreadySeen] = useState(true)

  useEffect(() => {
    if (!showFirstVisitHint) return
    try {
      const dismissed = localStorage.getItem(`tooltip_dismissed_${FIRST_VISIT_HINT_STORAGE_KEY}`)
      setHintAlreadySeen(!!dismissed)
    } catch {
      setHintAlreadySeen(true)
    }
  }, [showFirstVisitHint])

  const updatePos = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
  }, [])

  useEffect(() => {
    if (open) {
      updatePos()
      window.addEventListener('scroll', updatePos, true)
      window.addEventListener('resize', updatePos)
    }
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open, updatePos])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setOpen(true)
      setActiveIndex(0)
      return
    }
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % actions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + actions.length) % actions.length)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(actions.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < actions.length) {
          actions[activeIndex].onClick()
          setOpen(false)
        }
        break
    }
  }

  const trigger = (
    <button
      onClick={(e) => { e.preventDefault(); setOpen(!open) }}
      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-haspopup="true"
    >
      <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
    </button>
  )

  return (
    <div className="relative inline-block text-left" ref={ref} onKeyDown={handleKeyDown}>
      {showFirstVisitHint && !hintAlreadySeen ? (
        <ContextualTooltip
          content="Toque aqui para ver mais ações"
          storageKey={FIRST_VISIT_HINT_STORAGE_KEY}
          position="left"
        >
          {trigger}
        </ContextualTooltip>
      ) : (
        <Tooltip content="Mais ações" position="left">
          {trigger}
        </Tooltip>
      )}

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1"
          style={{ top: pos.top, right: pos.right, zIndex: 9999 }}
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
              } ${idx === activeIndex ? 'bg-slate-50' : ''}`}
              role="menuitem"
              tabIndex={idx === activeIndex ? 0 : -1}
              ref={(el) => {
                if (idx === activeIndex && el) el.focus()
              }}
            >
              {action.icon ?? (
                action.variant === 'danger'
                  ? <Trash2 className="w-4 h-4" aria-hidden="true" />
                  : <Pencil className="w-4 h-4" aria-hidden="true" />
              )}
              {action.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
