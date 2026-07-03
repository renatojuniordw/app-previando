import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  meta?: string
}

export function PageHeader({ icon: Icon, title, description, action, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-6 h-6 text-amber-600 shrink-0" />}
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">{title}</h1>
          {description && (
            <p className="font-sans text-sm text-slate-500 mt-0.5 font-medium">{description}</p>
          )}
          {meta && (
            <p className="font-sans text-xs text-slate-400 mt-1">{meta}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
