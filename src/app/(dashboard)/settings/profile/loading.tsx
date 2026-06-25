export default function ProfileLoading() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-50 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
