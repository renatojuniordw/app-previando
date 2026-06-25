export default function DeadlinesLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-slate-200 rounded" />
        <div className="h-8 w-52 bg-slate-200 rounded" />
      </div>

      {/* Overdue section */}
      <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-100">
          <div className="h-4 w-28 bg-red-200 rounded" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0">
            <div className="w-14 h-10 bg-red-200 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-14 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>

      {/* Urgent section */}
      <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <div className="h-4 w-32 bg-amber-200 rounded" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0">
            <div className="w-14 h-10 bg-amber-200 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-14 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>

      {/* Upcoming section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="h-4 w-28 bg-slate-200 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0">
            <div className="w-14 h-10 bg-slate-200 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-14 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
