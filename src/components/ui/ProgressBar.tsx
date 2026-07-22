'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** Valor entre 0 e 100 */
  progress: number
  className?: string
  /** Exibe o percentual como texto à direita */
  showLabel?: boolean
  /** Cor do fill (default: amber) */
  variant?: 'amber' | 'blue' | 'emerald'
}

const VARIANT_CLASSES = {
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
}

export function ProgressBar({ progress, className, showLabel = true, variant = 'amber' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', VARIANT_CLASSES[variant])}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="font-sans text-xs font-semibold text-slate-500 shrink-0 tabular-nums">
          {clamped}%
        </span>
      )}
    </div>
  )
}
