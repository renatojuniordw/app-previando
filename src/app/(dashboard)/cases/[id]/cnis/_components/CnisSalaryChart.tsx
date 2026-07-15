'use client'

import { memo, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { CnisExtractedData } from '@/types/cnis'

interface Props {
  data: CnisExtractedData
}

interface ChartPoint {
  competencia: string
  valor: number
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const CnisSalaryChart = memo(function CnisSalaryChart({ data }: Props) {
  const chartData = useMemo(() => {
    const points: ChartPoint[] = []
    for (const p of data.periodos ?? []) {
      for (const s of p.salarios ?? []) {
        points.push({ competencia: s.competencia, valor: s.valor })
      }
    }
    points.sort((a, b) => a.competencia.localeCompare(b.competencia))

    // Limit to max 120 points for readability, sample if needed
    if (points.length > 120) {
      const step = Math.ceil(points.length / 120)
      return points.filter((_, i) => i % step === 0)
    }
    return points
  }, [data])

  if (chartData.length < 2) {
    return null
  }

  const avgSalary = chartData.reduce((sum, p) => sum + p.valor, 0) / chartData.length

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-slate-500" />
        <h3 className="font-serif font-bold text-base text-slate-900">
          Evolução Salarial
        </h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold">Média</p>
          <p className="font-sans font-bold text-sm text-slate-800">{formatBRL(avgSalary)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold">Mínimo</p>
          <p className="font-sans font-bold text-sm text-slate-800">{formatBRL(Math.min(...chartData.map(p => p.valor)))}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold">Máximo</p>
          <p className="font-sans font-bold text-sm text-slate-800">{formatBRL(Math.max(...chartData.map(p => p.valor)))}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="font-sans text-[10px] text-slate-400 uppercase font-bold">Total Períodos</p>
          <p className="font-sans font-bold text-sm text-slate-800">{chartData.length}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto -mx-1 pb-2">
        <div className="min-w-[600px]">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="competencia"
                tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [formatBRL(value), 'Salário']}
                labelFormatter={(label: string) => `Competência: ${label}`}
                contentStyle={{
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="#d97706"
                strokeWidth={2}
                dot={{ r: 3, fill: '#d97706', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#d97706', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <div className="w-3 h-0.5 bg-amber-600 rounded" />
        <span>Salário de Contribuição</span>
      </div>
    </div>
  )
})
