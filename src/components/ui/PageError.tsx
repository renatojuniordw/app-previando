'use client'

import { AlertTriangle } from 'lucide-react'

interface PageErrorProps {
  error?: Error & { digest?: string }
  reset?: () => void
  title?: string
}

export function PageError({ reset, title = 'Erro ao carregar página' }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="font-serif font-bold text-xl text-slate-900 mb-2">{title}</h2>
      <p className="font-sans text-sm text-slate-500 mb-6 max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou contate o suporte se o problema persistir.
      </p>
      {reset && (
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-slate-900 text-white font-sans font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
