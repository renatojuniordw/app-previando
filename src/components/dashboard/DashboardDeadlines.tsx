import { memo } from 'react'
import { Card } from '@/components/ui/Card'
import { Clock } from 'lucide-react'
import Link from 'next/link'

interface Deadline {
  id: string
  deadlineDate: string
  client: { name: string }
}

export const DashboardDeadlines = memo(function DashboardDeadlines({ deadlines }: { deadlines: Deadline[] }) {
  if (!deadlines.length) return null

  function deadlineDays(date: string) {
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  }

  return (
    <Card variant="light" className="p-0 overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)] flex align-items-center gap-2">
        <Clock className="w-4 h-4 text-[var(--color-primary)]" />
        <h3 className="font-serif font-bold text-base text-slate-900">Prazos Próximos</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {deadlines.map((d) => {
          const days = deadlineDays(d.deadlineDate)
          return (
            <Link
              key={d.id}
              href={`/cases/${d.id}`}
              className="flex align-items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface)] transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex align-items-center justify-content-center text-xs font-bold shrink-0 ${
                  days <= 1
                    ? 'bg-red-100 text-red-600'
                    : days <= 3
                      ? 'bg-[#F5D0C3] text-[var(--color-primary-dark)]'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {days}d
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{d.client.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {new Date(d.deadlineDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
})
