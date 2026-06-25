export default function BillingLoading() {
  return (
    <div className="space-y-6 max-w-2xl p-6 animate-pulse">
      {/* Title */}
      <div className="h-8 w-32 bg-slate-200 rounded" />

      {/* Current Plan card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-7 w-24 bg-slate-200 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-5 w-16 bg-slate-200 rounded" />
              <div className="h-7 w-28 bg-slate-200 rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-200 rounded" />
                  <div className="h-3 flex-1 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
            <div className="h-10 w-full bg-slate-200 rounded-lg mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
