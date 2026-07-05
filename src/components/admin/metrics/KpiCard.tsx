import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  highlight?: boolean
}

export function KpiCard({ icon: Icon, label, value, highlight }: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Icon className="w-4.5 h-4.5" aria-hidden="true" />
        </div>
        <span className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400">{label}</span>
      </div>
      <p className={`font-mono font-bold text-2xl ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}
