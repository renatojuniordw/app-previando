export default function DeadlinesLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-slate-50 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
