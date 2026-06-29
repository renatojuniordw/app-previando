'use client'

import { useRouter } from 'next/navigation'
import { UserPlus, FilePlus, Upload, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon: React.ReactNode
  href: string
  shortcut?: string
  primary?: boolean
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Novo Cliente',
    icon: <UserPlus className="w-4 h-4" aria-hidden="true" />,
    href: '/clients/list',
    primary: true,
    shortcut: 'g+n',
  },
  {
    label: 'Novo Caso',
    icon: <FilePlus className="w-4 h-4" aria-hidden="true" />,
    href: '/clients/list',
    shortcut: 'g+c',
  },
  {
    label: 'Upload CNIS',
    icon: <Upload className="w-4 h-4" aria-hidden="true" />,
    href: '/cases',
    shortcut: 'u',
  },
  {
    label: 'BPC/LOAS',
    icon: <Sparkles className="w-4 h-4" aria-hidden="true" />,
    href: '/cases',
    shortcut: 'b',
  },
]

export function DashboardQuickActions() {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => router.push(action.href)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm',
            action.primary
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          )}
          aria-label={`${action.label}${action.shortcut ? ` (atalho: ${action.shortcut})` : ''}`}
          title={`${action.label}${action.shortcut ? ` [${action.shortcut}]` : ''}`}
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
