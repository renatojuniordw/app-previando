'use client'

import { useApi } from '@/hooks/useApi'
import { cn } from '@/lib/utils'

interface Usage {
  plan: string
  usage: { totalClients: number; calculationsThisMonth: number; opinionsThisMonth: number; bpcAnalysesThisMonth: number; bpcSocialMediaThisMonth: number }
  limits: { maxClients: number; maxCalculationsPerMonth: number; maxOpinionsPerMonth: number; bpcEnabled: boolean; bpcAnalysesPerMonth: number; bpcSocialMediaPerMonth: number }
}

function UsageItem({ label, used, max }: { label: string; used: number; max: number }) {
  if (max === -1) return null
  const pct = Math.min((used / max) * 100, 100)
  const critical = pct >= 100
  const warning = pct >= 80

  return (
    <div className="flex items-center gap-2 text-xs font-sans">
      <span className="text-slate-600 w-20 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            critical ? 'bg-red-500' : warning ? 'bg-yellow-400' : 'bg-amber-600'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('w-12 text-right font-medium', critical ? 'text-red-600' : 'text-slate-500')}>
        {used}/{max}
      </span>
    </div>
  )
}

export function UsageBar() {
  const { data: usage } = useApi<Usage>('/usage')

  if (!usage) return null

  if (usage.plan === 'FREE') {
    return (
      <div className="px-4 py-3 bg-white border-b border-slate-200 space-y-2">
        <span className="font-sans text-xs text-slate-500 font-bold tracking-wide">USO FREE</span>
        <UsageItem label="Clientes" used={usage.usage.totalClients} max={usage.limits.maxClients} />
        <UsageItem
          label="Cálculos"
          used={usage.usage.calculationsThisMonth}
          max={usage.limits.maxCalculationsPerMonth}
        />
      </div>
    )
  }

  if (usage.plan === 'SOLO' && usage.limits.bpcEnabled) {
    return (
      <div className="px-4 py-3 bg-white border-b border-slate-200 space-y-2">
        <span className="font-sans text-xs text-slate-500 font-bold tracking-wide">USO BPC — SOLO</span>
        {usage.limits.bpcAnalysesPerMonth !== -1 && (
          <UsageItem
            label="Análises BPC"
            used={usage.usage.bpcAnalysesThisMonth}
            max={usage.limits.bpcAnalysesPerMonth}
          />
        )}
        {usage.limits.bpcSocialMediaPerMonth !== -1 && (
          <UsageItem
            label="Carrosséis"
            used={usage.usage.bpcSocialMediaThisMonth}
            max={usage.limits.bpcSocialMediaPerMonth}
          />
        )}
      </div>
    )
  }

  return null
}
