'use client'

import { Inbox } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export interface ContextualEmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  icon?: ReactNode
}

export function ContextualEmptyState({ title, description, actionLabel, actionHref, icon }: ContextualEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        {icon ?? <Inbox className="h-7 w-7 text-slate-400" />}
      </div>
      <h3 className="font-sans text-sm font-semibold text-slate-600">
        {title}
      </h3>
      <p className="mt-1 max-w-xs font-sans text-xs text-slate-400">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-amber-600"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
