interface SearchResultItemProps {
  icon: React.ReactNode
  label: string
  subtitle?: string
  href: string
  isActive: boolean
  onSelect: () => void
}

export function SearchResultItem({ icon, label, subtitle, isActive, onSelect }: SearchResultItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isActive ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-700'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-bold truncate">{label}</p>
        {subtitle && <p className="font-sans text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
    </button>
  )
}
