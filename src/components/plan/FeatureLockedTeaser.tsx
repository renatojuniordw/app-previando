'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'
import { FEATURE_MARKETING, PLAN_DISPLAY_NAMES } from '@/lib/feature-marketing'
import { trackConversion } from '@/lib/track-conversion'

// Página de "degustação" exibida no lugar de uma feature bloqueada pelo plano.
// O preview ao fundo é 100% estático (dados fake do catálogo de marketing) —
// nunca renderizar resultado real borrado: blur em CSS é removível pelo
// DevTools; o dado verdadeiro não pode chegar ao client.
export function FeatureLockedTeaser({
  feature,
  requiredPlan = 'SOLO',
}: {
  feature: string
  requiredPlan?: string
}) {
  const router = useRouter()
  const marketing = FEATURE_MARKETING[feature]
  const planName = PLAN_DISPLAY_NAMES[requiredPlan] ?? requiredPlan

  useEffect(() => {
    trackConversion('TEASER_VIEW', feature)
  }, [feature])

  if (!marketing) return null

  return (
    <div className="relative min-h-[560px] rounded-2xl overflow-hidden border border-slate-200 bg-white">
      {/* Preview fake borrado ao fundo */}
      <div className="absolute inset-0 p-6 md:p-8 blur-[3px] opacity-60 pointer-events-none select-none" aria-hidden="true">
        <div className="h-5 w-52 bg-slate-200 rounded mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {marketing.previewTiles.map((tile) => (
            <div key={tile.label} className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-4">
              <span className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                {tile.label}
              </span>
              <span className="font-mono font-bold text-lg text-slate-800 tabular-nums">
                {tile.value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
          <div className="h-9 bg-slate-50 border-b border-slate-100" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-50">
              <div className="h-3 bg-slate-100 rounded w-1/4" />
              <div className="h-3 bg-slate-100 rounded w-1/6" />
              <div className="h-3 bg-slate-200 rounded w-1/5" />
              <div className="h-3 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Gradiente para dar contraste ao card */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white pointer-events-none" aria-hidden="true" />

      {/* Card de valor */}
      <div className="relative flex items-center justify-center min-h-[560px] p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-elevation-md p-7 md:p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-sans font-extrabold text-[10px] uppercase tracking-wider border rounded-full bg-amber-100/70 text-amber-800 border-amber-200 mb-3">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Disponível no plano {planName}
          </span>

          <h2 className="font-serif font-bold text-2xl text-slate-900 leading-snug mb-2">
            {marketing.title}
          </h2>
          <p className="font-sans text-sm text-slate-600 leading-relaxed mb-6">
            {marketing.tagline}
          </p>

          <ul className="space-y-2.5 mb-7 text-left mx-auto w-fit">
            {marketing.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 font-sans text-sm text-slate-700 leading-snug">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              trackConversion('TEASER_CTA_CLICK', feature)
              // `from`/`plan` deixam a página de billing contextualizada:
              // banner com a feature de origem e destaque no plano recomendado
              router.push(`/settings/billing?from=${feature}&plan=${requiredPlan}`)
            }}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 font-sans font-semibold text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 cursor-pointer select-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            Conhecer o plano {planName}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <p className="font-sans text-[11px] text-slate-400 mt-3">
            Upgrade imediato · seus dados e casos são preservados
          </p>
        </div>
      </div>
    </div>
  )
}
