import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'neo-btn neo-btn-primary',
  dark: 'neo-btn neo-btn-primary',
  outline: 'neo-btn-outline',
  danger: 'neo-btn-danger',
  ghost: 'neo-btn-ghost',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex align-items-center justify-content-center gap-2 font-sans font-medium tracking-wide transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]',
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
