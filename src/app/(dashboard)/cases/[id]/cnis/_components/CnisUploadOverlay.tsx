import { Loader2 } from 'lucide-react'

export function CnisUploadOverlay() {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center space-y-6 animate-slide-down">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 text-amber-600 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-xl text-slate-900">Enviando documento…</h3>
          <p className="font-sans text-sm text-slate-500 leading-relaxed">
            O arquivo está sendo enviado de forma segura para o nosso servidor.
          </p>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full w-1/2 animate-loading-bar" />
        </div>
      </div>
    </div>
  )
}
