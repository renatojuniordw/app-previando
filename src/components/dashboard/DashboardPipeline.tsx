import { Card } from '@/components/ui/Card'
import { Activity } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/constants'

interface PipelineData {
  byStatus: Record<string, number>
  total: number
  byBenefitType: Array<{ name: string; count: number }>
}

export function DashboardPipeline({ data }: { data: PipelineData }) {
  return (
    <Card variant="light" className="p-0 overflow-hidden lg:col-span-2">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-serif font-bold text-lg text-slate-900">Pipeline</h3>
        <Activity className="w-5 h-5 text-slate-400" />
      </div>
      <div className="p-6 bg-slate-50/50">
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="font-sans font-bold text-2xl text-slate-800 mb-2">
                {data.byStatus[status] ?? 0}
              </div>
              <div className="font-sans text-xs text-slate-500 text-center leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {data.byBenefitType.length > 0 && (
        <div className="p-6 border-t border-slate-100">
          <h4 className="font-sans font-semibold text-sm text-slate-700 mb-3">Distribuição por Tipo de Benefício</h4>
          <div className="space-y-2">
            {data.byBenefitType.map((b) => {
              const pct = data.total ? Math.round((b.count / data.total) * 100) : 0
              return (
                <div key={b.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 truncate">{b.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-700 font-semibold w-6 text-right">{b.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
