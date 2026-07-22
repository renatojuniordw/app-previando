'use client'

import { useRef } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { UserPlus, FolderPlus, Upload, X, Zap } from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  label: string
  icon: typeof UserPlus
  href: string
  description?: string
}

const ACTIONS: QuickAction[] = [
  { label: 'Novo Cliente', icon: UserPlus, href: '/clients/new', description: 'Adicionar cliente à base' },
  { label: 'Novo Caso', icon: FolderPlus, href: '/cases/new', description: 'Registrar um novo caso' },
  { label: 'Importar CNIS', icon: Upload, href: '/tools/cnis', description: 'Upload de extrato previdenciário' },
]

interface QuickActionSheetProps {
  open: boolean
  onClose: () => void
}

export function QuickActionSheet({ open, onClose }: QuickActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useFocusTrap(open, sheetRef)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ações rápidas"
        className="relative w-full bg-white shadow-2xl animate-slide-up sm:max-w-sm sm:rounded-2xl sm:mx-4 rounded-t-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-lg text-slate-900">Ações Rápidas</h2>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-3 space-y-1">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={onClose}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-sans text-sm font-bold text-slate-900">{action.label}</p>
                  {action.description && (
                    <p className="font-sans text-xs text-slate-500">{action.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
