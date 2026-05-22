'use client'

import { useUpgradeModal } from '@/store/upgrade-modal'
import { useRouter } from 'next/navigation'

export function UpgradeModal() {
  const { open, message, upgradeRequired, closeModal } = useUpgradeModal()
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="neo-card max-w-md w-full p-6">
        <div className="mb-4">
          <span className="neo-badge-amber text-xs mb-2 block w-fit">UPGRADE NECESSÁRIO</span>
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
            className="neo-btn flex-1"
          >
            Ver Planos
          </button>
          <button onClick={closeModal} className="neo-btn-outline flex-1 text-slate-900">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
