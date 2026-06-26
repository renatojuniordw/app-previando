'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MessageSquare, CheckSquare, Bot, Briefcase, X, Building2 } from 'lucide-react'

interface CaseFloatingActionsProps {
  activeDrawer: string | null
  setDrawer: (drawerName: string | null) => void
  benefitType?: string
}

export function CaseFloatingActions({ activeDrawer, setDrawer, benefitType }: CaseFloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleAction = (drawerName: string) => {
    setDrawer(activeDrawer === drawerName ? null : drawerName)
    setIsOpen(false)
  }

  const actions = [
    {
      id: 'notes',
      label: 'Prontuário',
      icon: MessageSquare,
      color: 'hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50',
    },
    {
      id: 'checklist',
      label: 'Checklist',
      icon: CheckSquare,
      color: 'hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50',
    },
    {
      id: 'opinions',
      label: 'Parecer IA',
      icon: Bot,
      color: 'hover:text-[var(--color-primary)] hover:border-[#F0B09A] hover:bg-[rgba(242,232,228,0.5)]',
    },
    ...(benefitType === 'BPC_LOAS'
      ? [{
          id: 'bpc',
          label: 'Análises BPC',
          icon: Building2,
          color: 'hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50/50',
        }]
      : []),
  ]

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40 flex flex-column align-items-end gap-3">
      {/* Sub-buttons list */}
      <div
        className={cn(
          'flex flex-column align-items-end gap-3 transition-all duration-300 ease-out origin-bottom transform',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
        )}
      >
        {actions.map((action, index) => {
          const Icon = action.icon
          const isDrawerActive = activeDrawer === action.id

          return (
            <div key={action.id} className="flex align-items-center gap-2 group">
              {/* Text tooltip/label */}
              <span
                className={cn(
                  'px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-sans font-semibold shadow-md whitespace-nowrap transition-all duration-200 opacity-0 scale-95 origin-right translate-x-2 pointer-events-none',
                  isOpen && 'group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0'
                )}
              >
                {action.label}
              </span>

              {/* Action Button */}
              <button
                onClick={() => handleAction(action.id)}
                className={cn(
                  'w-12 h-12 rounded-full bg-white border border-[var(--color-border)] neo-btn flex align-items-center justify-content-center transition-all duration-200',
                  action.color,
                  isDrawerActive
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-tint)]/30'
                    : 'text-slate-600'
                )}
                aria-label={`Abrir ${action.label}`}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                }}
              >
                <Icon className="w-5 h-5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full flex align-items-center justify-content-center shadow-xl text-white transition-all duration-300 transform active:scale-95',
          isOpen
            ? 'bg-slate-800 hover:bg-slate-700 rotate-90 scale-95'
            : 'bg-[var(--color-primary)] hover:brightness-[1.1] hover:scale-105'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Abrir menu de ferramentas rápidas do caso"
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-fade-in" />
        ) : (
          <Briefcase className="w-6 h-6 animate-fade-in" />
        )}
      </button>
    </div>
  )
}
