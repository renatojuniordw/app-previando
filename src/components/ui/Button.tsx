import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-sm hover:shadow',
  dark: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-sm hover:shadow',
  outline: 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm hover:shadow',
  ghost: 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100',
}

const sizes = {
  sm: 'px-3 py-2 text-xs min-h-[40px] sm:min-h-0 sm:py-1.5',
  md: 'px-4 py-2 text-sm min-h-[44px] sm:min-h-0',
  lg: 'px-6 py-3 text-base min-h-[52px] sm:min-h-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide border rounded-md transition-colors duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
