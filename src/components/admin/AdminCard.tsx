import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AdminCardProps {
  icon?: LucideIcon
  title?: string
  badge?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function AdminCard({ icon: Icon, title, badge, action, children, className, bodyClassName }: AdminCardProps) {
  return (
    <div className={cn('bg-white border border-slate-200/80 rounded-2xl shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Icon className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
            )}
            {title && <h2 className="font-serif font-bold text-base text-slate-900 truncate">{title}</h2>}
            {badge}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-6', bodyClassName)}>{children}</div>
    </div>
  )
}
