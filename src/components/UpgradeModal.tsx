'use client'

import { useRef } from 'react'
import { useUpgradeModal } from '@/store/upgrade-modal'
import { useRouter } from 'next/navigation'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export function UpgradeModal() {
  const { open, message, upgradeRequired, closeModal } = useUpgradeModal()
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Plano e assinatura"
    >
      <div
        ref={dialogRef}
        className="bg-white text-slate-900 border border-slate-200 rounded-lg shadow-elevation-md max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeModal()
        }}
      >
        <div className="mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 font-sans font-medium text-xs tracking-wide border rounded-full bg-slate-100 text-slate-700 mb-2 block w-fit">
            UPGRADE NECESSÁRIO
          </span>
          <h2 className="font-serif font-bold text-xl text-slate-900">
            Plano {upgradeRequired} necessário
          </h2>
        </div>

        <p className="font-sans text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={() => {
              closeModal()
              router.push('/settings/billing')
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 cursor-pointer select-none shadow-sm flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            Ver Planos
          </button>
          <button
            onClick={closeModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 cursor-pointer select-none flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
