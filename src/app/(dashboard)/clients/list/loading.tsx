export default function ClientsListLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-44 bg-slate-100 rounded" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 w-full md:w-64 bg-slate-200 rounded-lg" />
          <div className="h-10 w-36 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* ClientSwitcher */}
      <div className="h-14 bg-white border border-slate-200 rounded-xl" />

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-14 bg-slate-200 rounded ml-auto" />
        </div>

        {/* Rows */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0"
          >
            {/* Client avatar + name */}
            <div className="flex items-center gap-3 flex-[2]">
              <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
            </div>

            {/* Contact */}
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>

            {/* Priority badge */}
            <div className="w-20">
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
            </div>

            {/* Cases count */}
            <div className="w-16">
              <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
            </div>

            {/* Date */}
            <div className="w-24">
              <div className="h-4 w-20 bg-slate-200 rounded" />
            </div>

            {/* Actions */}
            <div className="w-10">
              <div className="h-8 w-8 bg-slate-200 rounded-lg ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
