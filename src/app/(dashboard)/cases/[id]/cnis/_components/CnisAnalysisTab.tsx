'use client'

import { CnisStatsCard } from './CnisStatsCard'
import { CnisTimeline } from './CnisTimeline'
import { CnisHealthScore } from './CnisHealthScore'
import { CnisSalaryChart } from './CnisSalaryChart'
import type { CnisExtractedData } from '@/types/cnis'

interface Props {
  data: CnisExtractedData | null
}

export function CnisAnalysisTab({ data }: Props) {
  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <p className="font-sans text-sm text-slate-400">
          Nenhum dado disponível para análise.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CnisStatsCard data={data} />
      <CnisTimeline data={data} />
      <CnisHealthScore data={data} />
      <CnisSalaryChart data={data} />
    </div>
  )
}
