export default function ProfileLoading() {
  return (
    <div className="space-y-6 max-w-lg animate-pulse">
      {/* Title */}
      <div className="h-8 w-24 bg-slate-200 rounded" />

      {/* Account Data card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-slate-200 rounded" />
          <div className="h-5 w-36 bg-slate-200 rounded" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-12 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-10 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Change Password card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-slate-200 rounded" />
          <div className="h-5 w-28 bg-slate-200 rounded" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
          <div className="h-10 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Current Plan card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-slate-200 rounded" />
          <div className="h-5 w-24 bg-slate-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-12 bg-slate-200 rounded" />
          <div className="h-7 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded mt-3" />
        </div>
      </div>
    </div>
  )
}
