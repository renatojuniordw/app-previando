export default function ClientDetailLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Back navigation */}
      <div className="h-4 w-20 bg-slate-200 rounded" />

      {/* Header */}
      <div className="flex align-items-start justify-content-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-lg" />
      </div>

      {/* Client info card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex align-items-center gap-2">
          <div className="h-5 w-5 bg-slate-200 rounded" />
          <div className="h-5 w-36 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="h-16 w-full bg-slate-50 rounded-lg" />
      </div>

      {/* Cases card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <div className="h-5 w-5 bg-slate-200 rounded" />
            <div className="h-5 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded-lg" />
        </div>

        {/* Case items */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-4 flex align-items-center justify-content-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
            <div className="flex align-items-center gap-2">
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              <div className="h-5 w-14 bg-slate-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
