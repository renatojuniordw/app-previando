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
  // YYYY-MM -> "MMM/YY"
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

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload || !payload.length) return null
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

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

function currencyFormatter(value: number) {
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value}`
}

export const ReportBarChart = memo(function ReportBarChart({
  title,
  data,
  categories,
  height = 260,
}: ReportChartProps) {
  if (!data || data.length === 0) return null

  const hasCurrency = categories.some(
    (c) => c.key === 'expected' || c.key === 'realized' || c.key === 'valor'
  )

  const hasMixedTypes = categories.some((c) => c.type === 'line')

  if (hasMixedTypes) {
    return (
      <Card variant="light" className="p-6">
        <h3 className="font-serif font-bold text-base text-slate-900 mb-4">
          {title}
        </h3>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data.map((d) => ({ ...d, label: formatMonthLabel(d.month as string) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              tickFormatter={hasCurrency ? currencyFormatter : undefined}
            />
            <Tooltip content={<CustomTooltip />} />
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
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    )
  }

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
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
            tickFormatter={hasCurrency ? currencyFormatter : undefined}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />
          {categories.map((cat) => (
            <Bar
              key={cat.key}
              dataKey={cat.key}
              name={cat.name}
              fill={cat.color}
              radius={[3, 3, 0, 0]}
              barSize={20}
            />
          ))}
        </BarChart>
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
  if (!data || data.length === 0) return null

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">
        {title}
      </h3>
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
            allowDecimals={false}
          />
          <Tooltip />
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
