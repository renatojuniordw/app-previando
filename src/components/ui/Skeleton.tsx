'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  count?: number
}

/**
 * Skeleton component for loading states
 *
 * @example
 * // Single text line
 * <Skeleton variant="text" />
 *
 * // Card skeleton with 3 lines
 * <Skeleton variant="card" count={3} />
 *
 * // Avatar circle
 * <Skeleton variant="circular" width={40} height={40} />
 */
export function Skeleton({ className, variant = 'text', width, height, count = 1 }: SkeletonProps) {
  const variantClass = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'h-24 w-full rounded-md',
    card: 'h-32 w-full rounded-xl',
  }

  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-slate-200',
            variantClass[variant],
            className
          )}
          style={{
            width: width ?? (variant === 'circular' ? 40 : undefined),
            height: height ?? undefined,
            animationDelay: `${i * 0.1}s`,
          }}
          aria-hidden="true"
          role="presentation"
        />
      ))}
    </>
  )
}

/**
 * A table skeleton with rows and columns
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" role="presentation" aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={`h-${i}`} variant="text" className="flex-1 h-5 bg-slate-300" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton
              key={`r${row}-c${col}`}
              variant="text"
              className="flex-1"
              width={`${70 + Math.random() * 30}%`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Card skeleton with title and description lines
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-sm">
          <Skeleton variant="text" className="w-1/3 h-5" />
          <Skeleton variant="text" className="w-2/3 h-8" />
          <Skeleton variant="text" className="w-full h-4" />
          <Skeleton variant="text" className="w-3/4 h-4" />
        </div>
      ))}
    </div>
  )
}

/**
 * Detail page skeleton (like case view or client profile)
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6" role="presentation" aria-hidden="true">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-64 h-8" />
          <Skeleton variant="text" className="w-48 h-4" />
        </div>
        <Skeleton variant="rectangular" className="w-24 h-10 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={`tab-${i}`} variant="text" className="w-24 h-8" />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-32" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="card" className="h-40" />
          <Skeleton variant="card" className="h-56" />
        </div>
      </div>
    </div>
  )
}
