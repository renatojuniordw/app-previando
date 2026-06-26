import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
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
            'neo-input w-full',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="font-sans text-sm text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="font-sans text-sm text-slate-500">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
