'use client'

import { useUpgradeModal } from '@/store/upgrade-modal'
import { useRouter } from 'next/navigation'

export function UpgradeModal() {
  const { open, message, upgradeRequired, closeModal } = useUpgradeModal()
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex align-items-center justify-content-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white text-slate-900 border border-slate-200 rounded-lg max-w-md w-full p-6 neo-card-flat">
        <div className="mb-4">
          <span className="inline-flex align-items-center px-2.5 py-0.5 font-sans font-medium text-xs tracking-wide border rounded-full bg-slate-100 text-slate-700 mb-2 block w-fit">
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
            className="inline-flex align-items-center justify-content-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 cursor-pointer select-none neo-btn flex-1"
          >
            Ver Planos
          </button>
          <button
            onClick={closeModal}
            className="inline-flex align-items-center justify-content-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 cursor-pointer select-none flex-1"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
