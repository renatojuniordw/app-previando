'use client'

import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { STATUS_LABELS } from '@/lib/constants'

interface ConversionFunnelProps {
  data: Record<string, number>
}

const PHASE_ORDER = ['PROSPECCAO', 'ANALISE', 'PRONTO_PARA_REQUERER', 'EM_PROCESSAMENTO', 'FINALIZADO']

const PHASE_COLORS = ['#d97706', '#2563eb', '#7c3aed', '#059669', '#22c55e']

export const ConversionFunnel = memo(function ConversionFunnel({
  data,
}: ConversionFunnelProps) {
  if (!data || Object.keys(data).length === 0) return null

  const total = Math.max(
    PHASE_ORDER.reduce((acc, p) => acc + (data[p] ?? 0), 0),
    1
  )

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">
        Funil de Conversão
      </h3>
      <div className="space-y-3">
        {PHASE_ORDER.map((phase, i) => {
          const count = data[phase] ?? 0
          const pct = (count / total) * 100
          return (
            <div key={phase}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-sm font-medium text-slate-700">
                  {STATUS_LABELS[phase] ?? phase}
                </span>
                <span className="font-sans text-sm font-semibold text-slate-900">
                  {count}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: PHASE_COLORS[i],
                  }}
                />
              </div>
              {i < PHASE_ORDER.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className="text-slate-300"
                  >
                    <path
                      d="M6 10L1 4h10z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
})
