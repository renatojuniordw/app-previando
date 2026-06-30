'use client'

import { memo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { BENEFIT_LABELS, BENEFIT_SHORT_LABELS } from '@/lib/constants'

const DONUT_COLORS = [
  '#d97706',
  '#2563eb',
  '#059669',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#be185d',
  '#65a30d',
  '#0d9488',
  '#9333ea',
  '#ea580c',
]

interface ReportPieChartProps {
  title: string
  data: Array<{ name: string; value: number }>
  height?: number
  donut?: boolean
  useBenefitLabels?: boolean
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { name: string } }>
}) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-slate-900">{entry.payload.name}</p>
      <p className="text-slate-600">{entry.value} caso(s)</p>
    </div>
  )
}

const renderCustomLabel = ({
  percent,
}: {
  name: string
  percent: number
}) => {
  if (percent < 0.05) return null
  return `${(percent * 100).toFixed(0)}%`
}

export const ReportPieChart = memo(function ReportPieChart({
  title,
  data,
  height = 280,
  donut = true,
  useBenefitLabels = false,
}: ReportPieChartProps) {
  if (!data || data.length === 0) return null

  const chartData = data.map((d) => ({
    ...d,
    name: useBenefitLabels
      ? BENEFIT_SHORT_LABELS[d.name] ?? BENEFIT_LABELS[d.name] ?? d.name
      : d.name,
  }))

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={donut ? 50 : 0}
            outerRadius={90}
            label={renderCustomLabel}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={DONUT_COLORS[i % DONUT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
})

export { DONUT_COLORS }
