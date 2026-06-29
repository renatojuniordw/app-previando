import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { TrendingUp, Users, Briefcase, Calculator, DollarSign } from 'lucide-react'

export type KpiColor = 'amber' | 'green' | 'red' | 'blue' | 'purple'

const COLOR_STYLES: Record<KpiColor, { bg: string; text: string; icon: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
  green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
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
    <Card variant="light" className={cn('p-5 flex flex-col gap-3', styles.bg)}>
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-full bg-white/80 flex items-center justify-center', styles.icon)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className={cn('font-serif font-bold text-2xl', styles.text)}>
        {value}
      </p>
      {subtitle && (
        <p className="font-sans text-xs text-slate-500">{subtitle}</p>
      )}
    </Card>
  )
})
