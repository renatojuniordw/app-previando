'use client'

import { Filter } from 'lucide-react'
import { AdminCard } from '@/components/admin/AdminCard'
import { useApi } from '@/hooks/useApi'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface FunnelRow {
  feature: string
  teaserViews: number
  teaserClicks: number
  modalViews: number
  modalClicks: number
  uniqueClickers: number
  conversions: number
}

interface FunnelData {
  funnel: FunnelRow[]
  conversionWindowDays: number
}

const FEATURE_SHORT_LABELS: Record<string, string> = {
  SIMULATOR: 'Simulador',
  CALCULATIONS: 'Cálculos',
  RETROATIVOS: 'Retroativos',
  EXPORT_PDF: 'Export PDF',
  DIAGNOSIS: 'Diagnóstico IA',
  OPINIONS: 'Pareceres IA',
  USE_BPC_MODULE: 'BPC/LOAS',
  BPC_ANALYSIS: 'Análises BPC',
  PETICAO: 'Petição IA',
  REVISION_MODULE: 'Revisão',
  GPS_MODULE: 'GPS/DAS',
  VIABILITY_SCORE: 'Score Viabilidade',
  CLIENTS: 'Limite de clientes',
  CLIENT_OVER_LIMIT: 'Limite de clientes',
}

function pct(num: number, den: number): string {
  if (den === 0) return '—'
  return `${((num / den) * 100).toFixed(0)}%`
}

export function ConversionFunnelCard() {
  const { data, loading, error } = useApi<FunnelData>('/admin/conversion-funnel')

  return (
    <AdminCard icon={Filter} title="Funil de Conversão (Paywall)">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : error || !data ? (
        <p className="font-sans text-sm text-slate-500">Não foi possível carregar o funil.</p>
      ) : data.funnel.length === 0 ? (
        <p className="font-sans text-sm text-slate-500">
          Nenhum evento registrado ainda. Os eventos aparecem quando usuários free encontram um paywall.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-2 pr-3">Feature</th>
                <th className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-2 px-3 text-right">Views</th>
                <th className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-2 px-3 text-right">Cliques</th>
                <th className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-2 px-3 text-right">CTR</th>
                <th
                  className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-2 pl-3 text-right"
                  title={`Usuários distintos que clicaram no CTA e pagaram em até ${data.conversionWindowDays} dias`}
                >
                  Conversões
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.funnel.map((row) => {
                const views = row.teaserViews + row.modalViews
                const clicks = row.teaserClicks + row.modalClicks
                // <50 views: taxa ainda não é confiável, sinalizar visualmente
                const lowVolume = views < 50
                return (
                  <tr key={row.feature}>
                    <td className="font-sans text-sm font-semibold text-slate-800 py-2.5 pr-3">
                      {FEATURE_SHORT_LABELS[row.feature] ?? row.feature}
                    </td>
                    <td className="font-mono text-sm text-slate-600 py-2.5 px-3 text-right tabular-nums">{views}</td>
                    <td className="font-mono text-sm text-slate-600 py-2.5 px-3 text-right tabular-nums">{clicks}</td>
                    <td className={cn('font-mono text-sm py-2.5 px-3 text-right tabular-nums', lowVolume ? 'text-slate-400' : 'text-slate-800 font-semibold')}>
                      {pct(clicks, views)}
                      {lowVolume && views > 0 && <span title="Menos de 50 views — taxa pouco confiável">*</span>}
                    </td>
                    <td className={cn('font-mono text-sm py-2.5 pl-3 text-right tabular-nums font-bold', row.conversions > 0 ? 'text-emerald-700' : 'text-slate-400')}>
                      {row.conversions}
                      {row.uniqueClickers > 0 && (
                        <span className="text-slate-400 font-medium"> / {row.uniqueClickers}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="font-sans text-[11px] text-slate-400 mt-3">
            Conversões = usuários que clicaram no CTA e pagaram em até {data.conversionWindowDays} dias (sobre o total que clicou). * = menos de 50 views.
          </p>
        </div>
      )}
    </AdminCard>
  )
}
