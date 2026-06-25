export default function CaseDetailLoading() {
  return (
    <div className="space-y-6 max-w-3xl animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-100 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-5 w-32 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-5 w-24 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-5 w-28 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-5 w-20 bg-slate-100 rounded" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-8 w-12 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
