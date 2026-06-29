'use client'

import { memo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Card } from '@/components/ui/Card'

interface ReportHorizontalBarProps {
  title: string
  data: Array<{ name: string; value: number; color?: string }>
  height?: number
  valueLabel?: string
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="text-slate-600">{payload[0].value} dias (média)</p>
    </div>
  )
}

export const ReportHorizontalBar = memo(function ReportHorizontalBar({
  title,
  data,
  height = 220,
}: ReportHorizontalBarProps) {
  if (!data || data.length === 0) return null

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 100, right: 20, top: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            stroke="#475569"
            width={95}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color ?? '#d97706'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
})
