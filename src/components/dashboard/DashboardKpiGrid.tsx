import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { Users, Briefcase, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

interface KpiData {
  totalClients: number
  totalCases: number
  critical: number
  finalized: number
  calculationsTotal: number
  avgRmi: number
  totalRmiPotencial: number
}

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const COLOR_STYLES: Record<string, { bg: string; text: string; hover: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-500', hover: 'hover:border-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-500', hover: 'hover:border-red-200' },
  green: { bg: 'bg-green-50', text: 'text-green-500', hover: 'hover:border-green-200' },
}

export const DashboardKpiGrid = memo(function DashboardKpiGrid({ data }: { data: KpiData }) {
  const items = [
    { icon: Users, label: 'Total de Clientes', value: data.totalClients, color: 'amber' },
    { icon: Briefcase, label: 'Casos Ativos', value: data.totalCases, color: 'amber' },
    { icon: AlertCircle, label: 'Atenção Crítica', value: data.critical, color: 'red' },
    { icon: CheckCircle2, label: 'Finalizados', value: data.finalized, color: 'green' },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(({ icon: Icon, label, value, color }) => {
          const styles = COLOR_STYLES[color] ?? COLOR_STYLES.amber
          return (
            <Card key={label} variant="light" className={`p-6 flex flex-col gap-4 group ${styles.hover} transition-colors`}>
              <div className={`w-10 h-10 rounded-full ${styles.bg} flex items-center justify-center ${styles.text}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-sans font-semibold text-3xl text-slate-900">{value}</p>
                <p className="font-sans font-medium text-sm text-slate-600 mt-1">{label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {(data.calculationsTotal ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="light" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Cálculos Realizados</span>
            </div>
            <p className="font-serif font-bold text-2xl text-slate-900">{data.calculationsTotal}</p>
          </Card>
          <Card variant="light" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">RMI Médio</span>
            </div>
            <p className="font-serif font-bold text-2xl text-slate-900">{formatCurrency(data.avgRmi)}</p>
          </Card>
          <Card variant="light" className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">RMI Total Potencial</span>
            </div>
            <p className="font-serif font-bold text-2xl text-slate-900">{formatCurrency(data.totalRmiPotencial)}</p>
          </Card>
        </div>
      )}
    </>
  )
})
