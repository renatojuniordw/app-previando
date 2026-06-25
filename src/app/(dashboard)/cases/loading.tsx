export default function CasesLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-32 bg-slate-50 rounded animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-6">
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
