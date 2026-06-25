export default function ActivityLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-36 bg-slate-100 rounded animate-pulse" />
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 bg-slate-100 rounded-full shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-64 bg-slate-50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
