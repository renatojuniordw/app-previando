import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants'

interface ChartsData {
  createdByMonth: Array<{ month: string; count: number }>
  byPriority: Record<string, number>
}

function formatMonthLabel(monthStr: string): string {
  return monthStr.slice(5) // só MM
}

export const DashboardCharts = memo(function DashboardCharts({ data }: { data: ChartsData }) {
  const monthChartData = (data.createdByMonth ?? []).map((m) => ({
    name: formatMonthLabel(m.month),
    casos: m.count,
  }))

  const priorityChartData = Object.entries(data.byPriority ?? {}).map(([k, v]) => ({
    name: PRIORITY_LABELS[k] ?? k,
    value: v,
    color: PRIORITY_COLORS[k] ?? '#94a3b8',
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {monthChartData.length > 0 && (
        <Card variant="light" className="p-6 lg:col-span-2">
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Casos por Mês</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="casos" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {priorityChartData.length > 0 && (
        <Card variant="light" className="p-6">
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Clientes por Prioridade</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={priorityChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {priorityChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
})
