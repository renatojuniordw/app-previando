import Link from 'next/link'
import { MessageSquare, Scale, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  counts: { caseNotes: number; calculations: number; checklists: number }
  caseId: string
}

const ITEMS = [
  { key: 'caseNotes' as const, label: 'Anotações', icon: MessageSquare, href: (id: string) => `/cases/${id}?drawer=notes`, borderHover: 'hover:border-blue-250', bgIcon: 'bg-blue-50 border-blue-100/50', colorIcon: 'text-blue-600' },
  { key: 'calculations' as const, label: 'Cálculos', icon: Scale, href: (id: string) => `/cases/${id}/calculator`, borderHover: 'hover:border-amber-250', bgIcon: 'bg-amber-50 border-amber-100/50', colorIcon: 'text-amber-600' },
  { key: 'checklists' as const, label: 'Checklist', icon: CheckSquare, href: (id: string) => `/cases/${id}?drawer=checklist`, borderHover: 'hover:border-emerald-250', bgIcon: 'bg-emerald-50 border-emerald-100/50', colorIcon: 'text-emerald-600' },
] as const

export function ActivitySummary({ counts, caseId }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {ITEMS.map(({ key, label, icon: Icon, href, borderHover, bgIcon, colorIcon }) => {
        return (
          <Link
            key={key}
            href={href(caseId)}
            className={cn(
              "p-3 sm:p-5 flex flex-col items-center sm:items-start sm:flex-row gap-2 sm:gap-0 sm:justify-between border-slate-200/80 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm active:bg-slate-50 rounded-xl group/card",
              borderHover
            )}
          >
            <div className="sm:space-y-1 text-center sm:text-left">
              <p className="font-sans text-[10px] font-extrabold text-slate-400 uppercase tracking-wider group-hover/card:text-amber-700 transition-colors">{label}</p>
              <p className="font-mono font-bold text-xl sm:text-2xl text-slate-800 leading-none mt-1 sm:mt-2">{counts[key] ?? 0}</p>
            </div>
            <div className={cn("w-7 h-7 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-xs", bgIcon)}>
              <Icon className={cn("w-3.5 h-3.5 sm:w-4.5 sm:h-4.5", colorIcon)} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
