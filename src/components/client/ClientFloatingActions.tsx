'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mail, Copy, Edit3, X, Zap } from 'lucide-react'

interface ClientFloatingActionsProps {
  email?: string | null
  cpf: string
  onEdit: () => void
  onCopyCpf: (cpf: string) => void
}

export function ClientFloatingActions({ email, cpf, onEdit, onCopyCpf }: ClientFloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  const actions = [
    {
      id: 'edit',
      label: 'Editar Cliente / Notas',
      icon: Edit3,
      color: 'hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 text-slate-600',
      onClick: () => { onEdit(); setIsOpen(false) },
      show: true,
    },
    {
      id: 'copy',
      label: 'Copiar CPF',
      icon: Copy,
      color: 'hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 text-slate-600',
      onClick: () => { onCopyCpf(cpf); setIsOpen(false) },
      show: !!cpf,
    },
    {
      id: 'email',
      label: 'Enviar E-mail',
      icon: Mail,
      color: 'hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-600',
      onClick: () => { window.location.href = `mailto:${email}`; setIsOpen(false) },
      show: !!email,
    },
  ].filter((a) => a.show)

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-60 flex flex-col items-end gap-3 pointer-events-none">
        <div
          className={cn(
            'flex flex-col items-end gap-3 transition-all duration-300 ease-out origin-bottom transform',
            isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
          )}
        >
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <div key={action.id} className="flex items-center gap-2 group">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-sans font-semibold shadow-md whitespace-nowrap transition-all duration-200 opacity-0 scale-95 origin-right translate-x-2 pointer-events-none',
                    isOpen && 'group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0'
                  )}
                >
                  {action.label}
                </span>
                <button
                  onClick={action.onClick}
                  className={cn(
                    'w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center transition-all duration-200 pointer-events-auto',
                    action.color
                  )}
                  aria-label={action.label}
                  style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-white transition-all duration-300 transform active:scale-95 pointer-events-auto',
            isOpen
              ? 'bg-slate-800 hover:bg-slate-700 rotate-90 scale-95'
              : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 hover:scale-105'
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Ações rápidas do cliente"
        >
          {isOpen ? <X className="w-6 h-6 animate-fade-in" /> : <Zap className="w-6 h-6 animate-fade-in" />}
        </button>
      </div>
  )
}
