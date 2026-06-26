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
        'rounded-lg p-5 transition-shadow',
        variant === 'light'
          ? 'neo-card-flat'
          : 'neo-card',
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
    <div className="flex align-items-start justify-content-between mb-4">
      <div>
        <h3 className="font-sans font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        {subtitle && <p className="font-sans text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
