import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { TrendingUp, Users, Briefcase, Calculator, DollarSign } from 'lucide-react'

export type KpiColor = 'amber' | 'green' | 'red' | 'blue' | 'purple'

const COLOR_STYLES: Record<KpiColor, { hoverBorder: string; iconBg: string; iconText: string }> = {
  amber: { hoverBorder: 'hover:border-amber-250', iconBg: 'bg-amber-50/70 border border-amber-100/50', iconText: 'text-amber-600' },
  green: { hoverBorder: 'hover:border-emerald-250', iconBg: 'bg-emerald-50/70 border border-emerald-100/50', iconText: 'text-emerald-600' },
  red: { hoverBorder: 'hover:border-red-250', iconBg: 'bg-red-50/70 border border-red-100/50', iconText: 'text-red-600' },
  blue: { hoverBorder: 'hover:border-blue-250', iconBg: 'bg-blue-50/70 border border-blue-100/50', iconText: 'text-blue-600' },
  purple: { hoverBorder: 'hover:border-amber-250', iconBg: 'bg-amber-50/70 border border-amber-100/50', iconText: 'text-amber-600' }, // Purple Ban: mapped to Amber
}

const ICON_MAP = {
  trending: TrendingUp,
  users: Users,
  briefcase: Briefcase,
  calculator: Calculator,
  dollar: DollarSign,
} as const

export type KpiIconName = keyof typeof ICON_MAP

interface ReportKpiCardProps {
  label: string
  value: string | number
  color?: KpiColor
  icon?: KpiIconName
  subtitle?: string
}

export const ReportKpiCard = memo(function ReportKpiCard({
  label,
  value,
  color = 'amber',
  icon,
  subtitle,
}: ReportKpiCardProps) {
  const styles = COLOR_STYLES[color]
  const Icon = icon ? ICON_MAP[icon] : null

  return (
    <Card variant="light" className={cn('p-5 flex flex-col justify-between border-slate-200/80 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm', styles.hoverBorder)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          {Icon && (
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shadow-xs shrink-0', styles.iconBg, styles.iconText)}>
              <Icon className="w-4.5 h-4.5" />
            </div>
          )}
        </div>
        <p className="font-mono font-bold text-2xl text-slate-800 tracking-tight leading-none">
          {value}
        </p>
      </div>
      {subtitle && (
        <p className="font-sans text-[10px] text-slate-400 mt-2 font-medium">{subtitle}</p>
      )}
    </Card>
  )
})
