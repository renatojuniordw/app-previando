import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4" aria-hidden="true">
        {icon || <Inbox className="w-6 h-6 text-slate-400" />}
      </div>
      <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="font-sans text-sm text-slate-500 max-w-sm leading-relaxed mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
