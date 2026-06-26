import { Card } from '@/components/ui/Card'
import { MessageSquare, Scale, CheckSquare } from 'lucide-react'

interface Props {
  counts: { caseNotes: number; calculations: number; checklists: number }
}

const ITEMS = [
  { key: 'caseNotes' as const, label: 'Anotações', icon: MessageSquare, color: 'blue' },
  { key: 'calculations' as const, label: 'Cálculos', icon: Scale, color: 'amber' },
  { key: 'checklists' as const, label: 'Checklist', icon: CheckSquare, color: 'emerald' },
] as const

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
  amber: { bg: 'bg-[var(--color-primary-tint)]', border: 'border-[#F5D0C3]', text: 'text-[var(--color-primary)]' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
}

export function ActivitySummary({ counts }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {ITEMS.map(({ key, label, icon: Icon, color }) => {
        const c = COLOR_MAP[color]
        return (
          <Card key={key} variant="light" className="p-6 flex align-items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${c.bg} border ${c.border} flex align-items-center justify-content-center ${c.text} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-sans text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</p>
              <p className="font-sans font-bold text-2xl text-slate-900 mt-0.5">{counts[key]}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
