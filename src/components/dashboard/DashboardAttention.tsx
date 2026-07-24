import { memo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { AlertTriangle, ClipboardList, Calculator } from 'lucide-react'

interface AttentionData {
  prospecting: number
  withoutCalculation: number
  critical: number
}

export const DashboardAttention = memo(function DashboardAttention({ data }: { data: AttentionData }) {
  const total = data.prospecting + data.withoutCalculation + data.critical
  if (total === 0) return null

  const items = [
    {
      icon: AlertTriangle,
      label: 'Atenção Crítica',
      value: data.critical,
      href: '/cases?priority=CRITICAL',
      color: 'red',
    },
    {
      icon: ClipboardList,
      label: 'Em Prospecção',
      value: data.prospecting,
      href: '/cases?status=PROSPECTING',
      color: 'amber',
    },
    {
      icon: Calculator,
      label: 'Sem Cálculo',
      value: data.withoutCalculation,
      href: '/cases',
      color: 'slate',
    },
  ]

  const COLOR_STYLES: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    red: { bg: 'bg-red-50/50', text: 'text-red-700', iconBg: 'bg-red-100 text-red-600', border: 'border-red-100' },
    amber: { bg: 'bg-amber-50/50', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600', border: 'border-amber-100' },
    slate: { bg: 'bg-slate-50/50', text: 'text-slate-600', iconBg: 'bg-slate-100 text-slate-500', border: 'border-slate-200' },
  }

  return (
    <Card variant="light" className="p-4 sm:p-6 bg-white border-slate-200 shadow-sm rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="font-serif font-bold text-base text-slate-900">Precisa de Atenção</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.filter((i) => i.value > 0).map(({ icon: Icon, label, value, href, color }) => {
          const styles = COLOR_STYLES[color] ?? COLOR_STYLES.slate
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${styles.bg} border ${styles.border} hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 flex-1 min-w-[160px]`}
            >
              <div className={`w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className={`font-sans font-bold text-lg ${styles.text}`}>{value}</p>
                <p className="font-sans text-[11px] text-slate-500 font-medium">{label}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
})
