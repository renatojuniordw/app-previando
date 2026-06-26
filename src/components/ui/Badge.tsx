import { cn } from '@/lib/utils'

type BadgeVariant = 'lime' | 'red' | 'yellow' | 'slate' | 'blue' | 'green' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  lime: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 font-sans font-medium text-xs tracking-wide border rounded-full',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
