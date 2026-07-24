import { memo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Users, Briefcase, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface KpiData {
  totalClients: number
  totalCases: number
  critical: number
  finalized: number
  calculationsTotal: number
  avgRmi: number
  totalRmiPotencial: number
}

const COLOR_STYLES: Record<string, { bg: string; text: string; hover: string; border: string }> = {
  amber: { 
    bg: 'bg-amber-50/50', 
    text: 'text-amber-700', 
    hover: 'hover:border-amber-200 hover:shadow-md',
    border: 'border-amber-100/60'
  },
  red: { 
    bg: 'bg-red-50/50', 
    text: 'text-red-700', 
    hover: 'hover:border-red-200 hover:shadow-md',
    border: 'border-red-100/60'
  },
  green: { 
    bg: 'bg-emerald-50/50', 
    text: 'text-emerald-700', 
    hover: 'hover:border-emerald-200 hover:shadow-md',
    border: 'border-emerald-100/60'
  },
}

export const DashboardKpiGrid = memo(function DashboardKpiGrid({ data }: { data: KpiData }) {
  const items = [
    { icon: Users, label: 'Total de Clientes', value: data.totalClients, color: 'amber', href: '/clients/list' },
    { icon: Briefcase, label: 'Casos Ativos', value: data.totalCases, color: 'amber', href: '/cases' },
    { icon: AlertCircle, label: 'Atenção Crítica', value: data.critical, color: 'red', href: '/cases?priority=CRITICAL' },
    { icon: CheckCircle2, label: 'Finalizados', value: data.finalized, color: 'green', href: '/cases?status=FINISHED' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {items.map(({ icon: Icon, label, value, color, href }) => {
          const styles = COLOR_STYLES[color] ?? COLOR_STYLES.amber
          return (
            <Link key={label} href={href}>
              <Card 
                variant="light" 
                className={`p-4 sm:p-6 flex items-center sm:flex-col gap-3 sm:gap-4 group ${styles.hover} transition-all duration-300 bg-white border-slate-200 shadow-sm rounded-xl hover:-translate-y-0.5 cursor-pointer`}
              >
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl ${styles.bg} border ${styles.border} flex items-center justify-center ${styles.text} shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="sm:text-center">
                  <p className="font-serif font-bold text-xl sm:text-3xl text-slate-900 tracking-tight">{value}</p>
                  <p className="font-sans font-semibold text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 sm:mt-1.5">{label}</p>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Métricas de Cálculo — sempre visível, ghost quando vazio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/reports">
          <Card variant="light" className="p-6 flex flex-col gap-2 bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Cálculos Realizados</span>
            </div>
            <p className="font-serif font-bold text-3xl text-slate-900">
              {data.calculationsTotal > 0 ? data.calculationsTotal : <span className="text-slate-300 font-normal text-lg">Nenhum ainda</span>}
            </p>
          </Card>
        </Link>
        <Link href="/reports">
          <Card variant="light" className="p-6 flex flex-col gap-2 bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">RMI Médio</span>
            </div>
            <p className="font-serif font-bold text-3xl text-slate-900">
              {data.avgRmi > 0 ? formatCurrency(data.avgRmi) : <span className="text-slate-300 font-normal text-lg">—</span>}
            </p>
          </Card>
        </Link>
        <Link href="/reports">
          <Card variant="light" className="p-6 flex flex-col gap-2 bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">RMI Total Potencial</span>
            </div>
            <p className="font-serif font-bold text-3xl text-slate-900">
              {data.totalRmiPotencial > 0 ? formatCurrency(data.totalRmiPotencial) : <span className="text-slate-300 font-normal text-lg">—</span>}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  )
})
