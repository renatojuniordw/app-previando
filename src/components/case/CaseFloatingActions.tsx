'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MessageSquare, CheckSquare, Bot, Briefcase, X, Building2, FileText, BookOpen } from 'lucide-react'

const HINT_DURATION = 5000
const HINT_DELAY = 2500
const LS_KEY = 'fab-has-interacted'

interface CaseFloatingActionsProps {
  activeDrawer: string | null
  setDrawer: (drawerName: string | null) => void
  benefitType?: string
}

export function CaseFloatingActions({ activeDrawer, setDrawer, benefitType }: CaseFloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showAttention, setShowAttention] = useState(true)
  const hasInteractedRef = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isCnisPage = pathname?.includes('/cnis')

  const hintText = isCnisPage
    ? 'Consulte o dicionário de indicadores'
    : 'Acesse ferramentas rápidas'

  // Resume interaction state after hydration
  useEffect(() => {
    const interacted = localStorage.getItem(LS_KEY) === 'true'
    hasInteractedRef.current = interacted
    if (interacted) {
      setShowAttention(false)
    }
  }, [])

  // Show hint on fresh pages if never interacted
  useEffect(() => {
    if (hasInteractedRef.current) return
    const show = setTimeout(() => setShowHint(true), HINT_DELAY)
    const hide = setTimeout(() => setShowHint(false), HINT_DELAY + HINT_DURATION)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [])

  // Close when clicking outside or pressing Escape
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

  const markInteracted = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true
      localStorage.setItem(LS_KEY, 'true')
      setShowHint(false)
      setShowAttention(false)
    }
  }

  const handleAction = (drawerName: string) => {
    markInteracted()
    setDrawer(activeDrawer === drawerName ? null : drawerName)
    setIsOpen(false)
  }

  const handleToggle = () => {
    markInteracted()
    setIsOpen(!isOpen)
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
      color: 'hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50',
    },
    {
      id: 'peticao',
      label: 'Petição Inicial',
      icon: FileText,
      color: 'hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50',
    },
    ...(isCnisPage
      ? [{
          id: 'dictionary',
          label: 'Dicionário',
          icon: BookOpen,
          color: 'hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50',
        }]
      : []),
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
    <div ref={menuRef} className="fixed bottom-[5rem] right-4 z-[60] flex flex-col items-end gap-2 sm:right-6 lg:bottom-6">
      {/* Sub-buttons list */}
      <div
        className={cn(
          'flex flex-col items-end gap-2 transition-all duration-300 ease-out origin-bottom transform',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-75 pointer-events-none invisible'
        )}
      >
        {actions.map((action, index) => {
          const Icon = action.icon
          const isDrawerActive = activeDrawer === action.id

          return (
            <div key={action.id} className="flex items-center gap-2 group">
              <span
                className={cn(
                  'px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-sans font-semibold shadow-md whitespace-nowrap transition-all duration-200 opacity-0 scale-95 origin-right translate-x-2 pointer-events-none',
                  isOpen && 'group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0'
                )}
              >
                {action.label}
              </span>
              <button
                onClick={() => handleAction(action.id)}
                className={cn(
                  'w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center transition-all duration-200 pointer-events-auto',
                  action.color,
                  isDrawerActive
                    ? 'border-amber-500 text-amber-600 bg-amber-50/30'
                    : 'text-slate-600'
                )}
                aria-label={`Abrir ${action.label}`}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                }}
              >
                <Icon className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Hint tooltip */}
      {showHint && (
        <div className="animate-hint-fade bg-slate-900 text-white text-[10px] font-sans font-semibold px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 whitespace-nowrap mb-1 pointer-events-auto">
          <Briefcase className="w-3 h-3 text-amber-400 shrink-0" />
          {hintText}
        </div>
      )}

      {/* Main Trigger Button */}
      <div className="relative pointer-events-auto">
        <button
          onClick={handleToggle}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center shadow-xl text-white transition-all duration-300 transform active:scale-95',
            isOpen
              ? 'bg-slate-800 hover:bg-slate-700 rotate-90 scale-95'
              : 'bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/20 hover:scale-105',
            showAttention && !isOpen && 'animate-fab-attention'
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Abrir menu de ferramentas rápidas do caso"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Briefcase className="w-5 h-5" />
          )}
        </button>
      </div>

    </div>
  )
}
