import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'light' | 'dark'
}

export function Card({ children, className, variant = 'dark' }: CardProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-5',
        variant === 'light'
          ? 'bg-white text-slate-900 border-slate-200 shadow-sm'
          : 'bg-slate-50 text-slate-900 border-slate-200 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-sans font-semibold text-base text-slate-900">{title}</h3>
        {subtitle && <p className="font-sans text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
