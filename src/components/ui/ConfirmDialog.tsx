'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    title: 'text-slate-900',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
    title: 'text-slate-900',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-slate-900 hover:bg-slate-800 focus-visible:ring-amber-500',
    title: 'text-slate-900',
  },
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef)

  if (!open) return null

  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white rounded-lg shadow-elevation-md max-w-sm w-full p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', styles.iconBg)}>
            <Icon className={cn('w-5 h-5', styles.iconColor)} />
          </div>
          <div>
            <h2 id="confirm-title" className={cn('font-serif font-bold text-lg', styles.title)}>
              {title}
            </h2>
            <p className="font-sans text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 font-sans font-medium text-sm rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md text-white transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
              styles.buttonBg
            )}
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
