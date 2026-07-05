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
  // Converte "2026-07" para "Jul"
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthNum = parseInt(monthStr.slice(5), 10)
  return months[monthNum - 1] ?? monthStr.slice(5)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-xl animate-fade-in">
        <p className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{payload[0].name}</p>
        <p className="font-sans text-xs font-extrabold text-white mt-0.5">
          {payload[0].value} {payload[0].value === 1 ? 'processo' : 'processos'}
        </p>
      </div>
    )
  }
  return null
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
        <Card variant="light" className="p-6 lg:col-span-2 bg-white border-slate-200 shadow-sm rounded-xl">
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Casos por Mês</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCasos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.15}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} />
              <Bar dataKey="casos" fill="url(#colorCasos)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {priorityChartData.length > 0 && (
        <Card variant="light" className="p-6 bg-white border-slate-200 shadow-sm rounded-xl">
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">Clientes por Prioridade</h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={35}
                  >
                    {priorityChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2.5">
              {priorityChartData.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="font-sans text-xs font-semibold text-slate-600">{entry.name}</span>
                  </div>
                  <span className="font-sans text-xs font-bold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
})
