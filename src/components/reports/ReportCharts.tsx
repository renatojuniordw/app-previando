'use client'

import { memo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

interface ReportChartProps {
  title: string
  data: Array<Record<string, string | number>>
  categories: Array<{
    key: string
    name: string
    color: string
    type?: 'bar' | 'line'
  }>
  height?: number
}

function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return ''
  const [y, m] = monthStr.split('-')
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ]
  const monthIndex = parseInt(m, 10) - 1
  return monthIndex >= 0 && monthIndex < 12
    ? `${months[monthIndex]}/${y?.slice(2)}`
    : monthStr
}

function formatValue(value: number): string {
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(2).replace('.', ',')}M`
  return formatCurrency(value)
}

function formatCount(value: number): string {
  return value.toLocaleString('pt-BR')
}

const CustomTooltip = ({
  active,
  payload,
  label,
  isCurrency = true,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  isCurrency?: boolean
}) => {
  if (!active || !payload || !payload.length) return null
  const fmt = isCurrency ? formatValue : formatCount

  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-slate-600">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-medium text-slate-900">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

function YAxisFormatter(value: number, isCurrency: boolean): string {
  if (!isCurrency) return formatCount(value)
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const ReportBarChart = memo(function ReportBarChart({
  title,
  data,
  categories,
  height = 260,
}: ReportChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card variant="light" className="p-6">
        <h3 className="font-serif font-bold text-base text-slate-900 mb-4">{title}</h3>
        <div className="h-[260px] flex items-center justify-center">
          <p className="font-sans text-sm text-slate-400">Sem dados no período selecionado.</p>
        </div>
      </Card>
    )
  }

  const isCurrency = categories.some(
    (c) => c.key === 'expected' || c.key === 'realized' || c.key === 'valor'
  )
  const hasMixedTypes = categories.some((c) => c.type === 'line')

  const ChartComponent = hasMixedTypes ? ComposedChart : BarChart
  const chartData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month as string),
  }))

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            tickFormatter={(v: number) => YAxisFormatter(v, isCurrency)}
          />
          <Tooltip content={<CustomTooltip isCurrency={isCurrency || hasMixedTypes} />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />
          {categories.map((cat) =>
            cat.type === 'line' ? (
              <Line
                key={cat.key}
                type="monotone"
                dataKey={cat.key}
                name={cat.name}
                stroke={cat.color}
                strokeWidth={2}
                dot={{ fill: cat.color, r: 3 }}
              />
            ) : (
              <Bar
                key={cat.key}
                dataKey={cat.key}
                name={cat.name}
                fill={cat.color}
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  )
})

export const ReportLineChart = memo(function ReportLineChart({
  title,
  data,
  categories,
  height = 260,
}: ReportChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card variant="light" className="p-6">
        <h3 className="font-serif font-bold text-base text-slate-900 mb-4">{title}</h3>
        <div className="h-[260px] flex items-center justify-center">
          <p className="font-sans text-sm text-slate-400">Sem dados no período selecionado.</p>
        </div>
      </Card>
    )
  }

  const isCurrency = categories.some(
    (c) => c.key === 'expected' || c.key === 'realized' || c.key === 'valor'
  )

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data.map((d) => ({
            ...d,
            label: formatMonthLabel(d.month as string),
          }))}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            tickFormatter={(v: number) => YAxisFormatter(v, isCurrency)}
          />
          <Tooltip content={<CustomTooltip isCurrency={isCurrency} />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />
          {categories.map((cat) => (
            <Line
              key={cat.key}
              type="monotone"
              dataKey={cat.key}
              name={cat.name}
              stroke={cat.color}
              strokeWidth={2}
              dot={{ fill: cat.color, r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
})
