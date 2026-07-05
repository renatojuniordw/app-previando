interface ProportionRowProps {
  label: string
  value: number
  total: number
  colorClass?: string
}

export function ProportionRow({ label, value, total, colorClass = 'bg-amber-500' }: ProportionRowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-sans text-slate-500">{label}</span>
        <span className="font-mono font-semibold text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="presentation">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
