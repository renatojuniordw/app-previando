'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mail, Copy, X, Zap } from 'lucide-react'

interface ClientFloatingActionsProps {
  email?: string | null
  cpf: string
  onCopyCpf: (cpf: string) => void
}

export function ClientFloatingActions({ email, cpf, onCopyCpf }: ClientFloatingActionsProps) {
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
    <div ref={menuRef} className="fixed bottom-[5rem] right-4 z-[60] flex flex-col items-end gap-2 sm:right-6 lg:bottom-6">
        <div
          className={cn(
            'flex flex-col items-end gap-2 transition-all duration-300 ease-out origin-bottom transform',
            isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-75 pointer-events-none invisible'
          )}
        >
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <div key={action.id} className="flex items-center gap-2 group">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-sans font-semibold shadow-md whitespace-nowrap transition-all duration-200 pointer-events-none',
                    isOpen
                      ? 'opacity-100 scale-100 translate-x-0 lg:opacity-0 lg:scale-95 lg:translate-x-2 lg:group-hover:opacity-100 lg:group-hover:scale-100 lg:group-hover:translate-x-0'
                      : 'opacity-0 scale-95 translate-x-2'
                  )}
                >
                  {action.label}
                </span>
                <button
                  onClick={action.onClick}
                  className={cn(
                    'w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center transition-all duration-200 pointer-events-auto',
                    action.color
                  )}
                  aria-label={action.label}
                  style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="relative pointer-events-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center shadow-xl text-white transition-all duration-300 transform active:scale-95',
              isOpen
                ? 'bg-slate-800 hover:bg-slate-700 rotate-90 scale-95'
                : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 hover:scale-105'
            )}
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="Ações rápidas do cliente"
          >
            {isOpen ? <X className="w-5 h-5 animate-fade-in" /> : <Zap className="w-5 h-5 animate-fade-in" />}
          </button>
        </div>
      </div>
  )
}
