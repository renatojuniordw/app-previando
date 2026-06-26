import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  error?: string
  hint?: string
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn('space-y-1', wrapperClassName)}>
        {label && (
          <label className="neo-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'neo-input-neo',
            error && 'ring-2 ring-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="font-sans text-sm" style={{ color: '#DC2626' }}>{error}</p>
        )}
        {hint && !error && (
          <p className="font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
