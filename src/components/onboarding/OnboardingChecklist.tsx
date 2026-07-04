'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, PartyPopper, X } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface OnboardingProgress {
  hasClients: boolean
  hasCases: boolean
  hasCnis: boolean
  hasCalculation: boolean
  hasOpinion: boolean
  completedSteps: number
  totalSteps: number
  isComplete: boolean
}

export function OnboardingChecklist() {
  const { data: progress } = useApi<OnboardingProgress>('/onboarding/progress')
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  if (!progress || dismissed || progress.isComplete) return null

  const steps = [
    { key: 'hasClients' as const, label: 'Cadastrar primeiro cliente', href: '/clients/list' },
    { key: 'hasCases' as const, label: 'Criar primeiro caso', href: '/clients/list' },
    { key: 'hasCnis' as const, label: 'Fazer upload do CNIS', href: '/cases' },
    { key: 'hasCalculation' as const, label: 'Fazer primeiro cálculo', href: '/cases' },
    { key: 'hasOpinion' as const, label: 'Gerar primeiro parecer', href: '/cases' },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        aria-expanded={expanded}
        aria-label="Checklist de início"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className={cn(
                'w-2 h-2 rounded-full absolute -top-1 -right-1 animate-ping',
                progress.completedSteps === progress.totalSteps ? 'bg-green-500' : 'bg-amber-500'
              )}
            />
            {progress.completedSteps === progress.totalSteps ? (
              <PartyPopper className="w-5 h-5 text-green-600" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-amber-600" aria-hidden="true" />
            )}
          </div>
          <span className="font-sans text-sm font-semibold text-slate-700">
            {progress.completedSteps === progress.totalSteps
              ? 'Primeiros passos concluídos! 🎉'
              : 'Primeiros passos'}
          </span>
          <span className="font-sans text-xs text-slate-400 font-medium ml-1">
            {progress.completedSteps}/{progress.totalSteps}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
        )}
      </button>

      {/* Steps */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {steps.map((step) => {
            const done = progress[step.key]
            return (
              <div key={step.key} className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                )}
                {done ? (
                  <span className="font-sans text-sm text-slate-400 line-through">{step.label}</span>
                ) : (
                  <Link
                    href={step.href}
                    className="font-sans text-sm text-slate-700 hover:text-amber-700 transition-colors"
                  >
                    {step.label}
                  </Link>
                )}
              </div>
            )
          })}

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="font-sans text-xs text-slate-400 hover:text-slate-600 mt-2 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Dispensar
          </button>
        </div>
      )}
    </div>
  )
}
