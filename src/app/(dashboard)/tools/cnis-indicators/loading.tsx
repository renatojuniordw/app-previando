export default function CnisIndicatorsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-8rem)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
        <p className="font-sans text-sm text-slate-500 animate-pulse">Carregando dicionário...</p>
      </div>
    </div>
  )
}
