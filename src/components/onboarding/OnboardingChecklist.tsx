'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  X,
  ArrowRight,
} from 'lucide-react'
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

  const completedPercent =
    progress.totalSteps > 0 ? Math.round((progress.completedSteps / progress.totalSteps) * 100) : 0

  const isAllDone = progress.completedSteps === progress.totalSteps

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300">
      {/* Header Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/50 focus-visible:outline-none"
        aria-expanded={expanded}
        aria-label="Checklist de início"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full',
                isAllDone ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            {isAllDone ? (
              <div className="shadow-xs flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
                <PartyPopper className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
            ) : (
              <div className="shadow-xs flex h-8 w-8 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600">
                <CheckCircle2 className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="text-left">
            <h4 className="font-serif text-sm font-bold leading-none text-slate-800">
              {isAllDone ? 'Primeiros passos concluídos! 🎉' : 'Primeiros Passos'}
            </h4>
            <p className="mt-1 font-sans text-[10px] font-medium text-slate-400">
              Complete as configurações recomendadas para iniciar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-md border border-slate-200/50 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
            {progress.completedSteps}/{progress.totalSteps}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="relative h-1 w-full shrink-0 bg-slate-100">
        <div
          className={cn(
            'h-full transition-all duration-700 ease-out',
            isAllDone ? 'bg-emerald-500' : 'bg-amber-500'
          )}
          style={{ width: `${completedPercent}%` }}
        />
      </div>

      {/* Steps List */}
      {expanded && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/20 px-5 py-4">
          <div className="space-y-1.5">
            {steps.map((step) => {
              const done = progress[step.key]
              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all duration-200',
                    done
                      ? 'border-slate-150 bg-slate-50/40 text-slate-400'
                      : 'hover:border-slate-350 hover:shadow-xs group border-slate-200/80 bg-white'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {done ? (
                      <CheckCircle2
                        className="w-4.5 h-4.5 shrink-0 text-emerald-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="w-4.5 h-4.5 text-slate-350 shrink-0 transition-colors group-hover:text-amber-500"
                        aria-hidden="true"
                      />
                    )}

                    {done ? (
                      <span className="truncate font-sans text-xs font-semibold line-through">
                        {step.label}
                      </span>
                    ) : (
                      <Link
                        href={step.href}
                        className="truncate font-sans text-xs font-bold text-slate-700 transition-colors hover:text-amber-700"
                      >
                        {step.label}
                      </Link>
                    )}
                  </div>

                  {!done && (
                    <Link
                      href={step.href}
                      className="shrink-0 transform text-slate-400 opacity-0 transition-colors duration-200 hover:text-amber-700 group-hover:translate-x-0.5 group-hover:opacity-100"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {/* Dismiss button at the bottom */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setDismissed(true)}
              className="flex items-center gap-1 py-1 font-sans text-[10px] font-bold text-slate-400 transition-colors hover:text-red-500 focus-visible:outline-none"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Dispensar guia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
