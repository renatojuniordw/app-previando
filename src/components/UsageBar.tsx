'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

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
    <div className="flex align-items-center gap-2 text-xs" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <span className="w-20 shrink-0 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <div className="neo-progress-track flex-1">
        <div
          className="neo-progress-fill"
          style={{
            width: `${pct}%`,
            background: critical ? '#DC2626' : warning ? '#EAB308' : 'var(--color-primary)',
          }}
        />
      </div>
      <span className="w-12 text-right font-medium" style={{ color: critical ? '#DC2626' : 'var(--color-text-muted)' }}>
        {used}/{max}
      </span>
    </div>
  )
}

export function UsageBar() {
  const [usage, setUsage] = useState<Usage | null>(null)

  useEffect(() => {
    api.get('/usage').then((r) => setUsage(r.data)).catch(() => null)
  }, [])

  if (!usage) return null

  if (usage.plan === 'FREE') {
    return (
      <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="font-sans text-xs font-bold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>USO FREE</span>
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
      <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="font-sans text-xs font-bold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>USO BPC — SOLO</span>
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
