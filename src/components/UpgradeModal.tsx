'use client'

import { useEffect, useRef } from 'react'
import { useUpgradeModal } from '@/store/upgrade-modal'
import { useRouter } from 'next/navigation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { FEATURE_MARKETING, PLAN_DISPLAY_NAMES } from '@/lib/feature-marketing'
import { trackConversion } from '@/lib/track-conversion'
import { CheckCircle2, Sparkles } from 'lucide-react'

const PLAN_PRICES: Record<string, string> = { SOLO: 'R$ 97/mês', PRO: 'R$ 197/mês' }

export function UpgradeModal() {
  const { open, message, feature, upgradeRequired, closeModal } = useUpgradeModal()
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, dialogRef)

  useEffect(() => {
    if (open && feature) trackConversion('PAYWALL_MODAL_VIEW', feature)
  }, [open, feature])

  if (!open) return null

  const isClientOverLimit = feature === 'CLIENT_OVER_LIMIT'
  const marketing = FEATURE_MARKETING[isClientOverLimit ? 'CLIENTS' : feature]
  const planName = PLAN_DISPLAY_NAMES[upgradeRequired] ?? upgradeRequired

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Plano e assinatura"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-elevation-md max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeModal()
        }}
      >
        <div className="px-6 pt-6 pb-5 bg-gradient-to-b from-amber-50/70 to-white border-b border-amber-100/60">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-sans font-extrabold text-[10px] uppercase tracking-wider border rounded-full bg-amber-100/70 text-amber-800 border-amber-200 mb-3 w-fit">
            <Sparkles className="w-3 h-3" />
            {isClientOverLimit ? 'Limite do plano' : `Disponível no plano ${planName} · ${PLAN_PRICES[upgradeRequired] ?? ''}`}
          </span>
          <h2 className="font-serif font-bold text-xl text-slate-900 leading-snug">
            {marketing?.title ?? `Plano ${planName} necessário`}
          </h2>
          {marketing?.tagline && (
            <p className="font-sans text-sm text-slate-600 mt-1.5 leading-relaxed">
              {marketing.tagline}
            </p>
          )}
        </div>

        <div className="px-6 py-5">
          {marketing ? (
            <>
              <ul className="space-y-2.5 mb-4">
                {marketing.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 font-sans text-sm text-slate-700 leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>
              {message && (
                <p className="font-sans text-xs text-slate-400 mb-5 leading-relaxed border-t border-slate-100 pt-3">
                  {message}
                </p>
              )}
            </>
          ) : (
            <p className="font-sans text-sm text-slate-600 mb-5 leading-relaxed">{message}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                trackConversion('PAYWALL_MODAL_CTA_CLICK', feature)
                closeModal()
                router.push(
                  isClientOverLimit
                    ? '/clients/list'
                    : `/settings/billing?from=${feature}&plan=${upgradeRequired}`
                )
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-sans font-semibold text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 cursor-pointer select-none shadow-sm flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              {isClientOverLimit ? 'Gerenciar Clientes' : `Conhecer o plano ${planName}`}
            </button>
            <button
              onClick={closeModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
