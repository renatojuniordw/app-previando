'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, FilePlus, Upload, Sparkles, Plus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon: React.ReactNode
  href: string
  description?: string
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Novo Cliente',
    icon: <UserPlus className="w-4 h-4" aria-hidden="true" />,
    href: '/clients/list',
    description: 'Adicionar segurado',
  },
  {
    label: 'Novo Caso',
    icon: <FilePlus className="w-4 h-4" aria-hidden="true" />,
    href: '/clients/list',
    description: 'Criar processo para cliente existente',
  },
  {
    label: 'Upload CNIS',
    icon: <Upload className="w-4 h-4" aria-hidden="true" />,
    href: '/cases',
    description: 'Extrair vínculos com IA',
  },
  {
    label: 'BPC/LOAS',
    icon: <Sparkles className="w-4 h-4" aria-hidden="true" />,
    href: '/cases',
    description: 'Benefício assistencial',
  },
]

export function DashboardQuickActions() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-lg text-sm font-semibold transition-all duration-200 bg-amber-600 text-white hover:bg-amber-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className="w-4 h-4" />
        <span>Novo</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-elevation-lg py-1 z-50 animate-fade-in"
          role="menu"
        >
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setOpen(false)
                router.push(action.href)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors duration-150 text-left"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                {action.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                {action.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{action.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
