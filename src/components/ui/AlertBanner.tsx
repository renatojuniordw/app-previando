import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AlertBannerProps {
  variant?: 'warning' | 'error' | 'success' | 'info'
  icon?: LucideIcon
  title: string
  children?: React.ReactNode
  className?: string
}

const variantStyles = {
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    textMuted: 'text-amber-700',
    icon: 'text-amber-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    textMuted: 'text-red-700',
    icon: 'text-red-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    textMuted: 'text-green-700',
    icon: 'text-green-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    textMuted: 'text-blue-700',
    icon: 'text-blue-600',
  },
}

export function AlertBanner({ variant = 'warning', icon: Icon, title, children, className }: AlertBannerProps) {
  const s = variantStyles[variant]

  return (
    <div className={cn('border rounded-xl p-4 flex items-start gap-3', s.bg, s.border, className)}>
      {Icon && <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', s.icon)} />}
      <div>
        <p className={cn('font-bold text-sm', s.text)}>{title}</p>
        {children && <div className={cn('text-sm mt-1', s.textMuted)}>{children}</div>}
      </div>
    </div>
  )
}
