import { Scale } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-slate-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-serif font-bold text-3xl tracking-tight">
              PREVI<span className="text-amber-500">ANDO</span>
            </h1>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="font-serif text-3xl font-bold leading-tight mb-4">
            Previdência inteligente e ágil para advogados modernos.
          </h2>
          <p className="font-sans text-slate-300 text-lg">
            Gerencie seus processos, organize seus clientes e ganhe tempo para focar no que realmente importa: a justiça.
          </p>
        </div>

        <div className="relative z-10">
          <p className="font-sans text-sm text-slate-400">
            © {new Date().getFullYear()} Previando. Um produto Unificando.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div id="auth-content" className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-white outline-none" tabIndex={-1}>
        {/* Mobile Logo */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center mb-3">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">
            PREVI<span className="text-amber-600">ANDO</span>
          </h1>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
