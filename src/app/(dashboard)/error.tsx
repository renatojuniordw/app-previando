'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard] Unhandled error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <div className="max-w-md">
        <h2 className="font-sans text-lg font-semibold text-slate-900 mb-2">
          Ocorreu um erro inesperado
        </h2>
        <p className="font-sans text-sm text-slate-500 mb-6">
          {error.message ?? 'Tente recarregar a página ou entre em contato com o suporte.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-900 text-white font-sans text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
