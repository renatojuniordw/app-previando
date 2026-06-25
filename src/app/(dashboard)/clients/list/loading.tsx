export default function ClientsListLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
