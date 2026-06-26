import { Loader2 } from 'lucide-react'

export function CnisUploadOverlay() {
  return (
    <div className="fixed inset-0 backdrop-blur-sm z-[999] flex align-items-center justify-content-center" style={{background:'rgba(0,0,0,0.4)'}}>
      <div className="neo-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-column align-items-center text-center space-y-6 animate-slide-down">
        <div className="relative flex align-items-center justify-content-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-tint)] flex align-items-center justify-content-center border border-[#F0B09A] text-[var(--color-primary)] animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-xl text-slate-900">Enviando documento…</h3>
          <p className="font-sans text-sm text-slate-500 leading-relaxed">
            O arquivo está sendo enviado de forma segura para o nosso servidor.
          </p>
        </div>
        <div className="w-full bg-[var(--color-card-inner)] h-1.5 rounded-full overflow-hidden relative">
          <div className="bg-[var(--color-primary)] h-full rounded-full w-1/2 animate-loading-bar" />
        </div>
      </div>
    </div>
  )
}
