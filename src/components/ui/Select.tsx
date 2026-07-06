import { cn } from '@/lib/utils'
import { forwardRef, useId } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode
  error?: string
  hint?: string
  success?: boolean
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, success, className, wrapperClassName, children, ...props }, ref) => {
    const id = useId()

    return (
      <div className={cn('space-y-1', wrapperClassName)}>
        {label && (
          <label htmlFor={id} className="neo-label">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'neo-input w-full appearance-none pr-10 bg-white text-slate-900 border border-slate-300 rounded-md',
              error && 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500',
              success && !error && 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          >
            {children}
          </select>
          {/* Custom Chevron Down Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${id}-error`} className="font-sans text-xs text-red-500 mt-1" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="font-sans text-xs text-slate-500 mt-1">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
