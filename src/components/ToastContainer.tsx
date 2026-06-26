'use client'

import { useToast } from '@/store/toast'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const ICON_COLORS = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 border rounded-xl shadow-lg animate-slide-up bg-white ${STYLES[toast.type]}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLORS[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-sans font-semibold text-sm">{toast.title}</p>
              {toast.message && (
                <p className="font-sans text-sm opacity-80 mt-0.5">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
