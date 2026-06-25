export default function BillingLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 w-full bg-slate-50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
