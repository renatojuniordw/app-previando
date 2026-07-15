import { Scale, Lock, ShieldCheck, CheckCircle } from 'lucide-react'
import { AuthHighlights } from './_components/AuthHighlights'
import { AuthTransition } from './_components/AuthTransition'
import { AuthMobileValue } from './_components/AuthMobileValue'
import { CookieConsent } from './_components/CookieConsent'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col md:flex-row">
      {/* Skip-to-content link */}
      <a
        href="#auth-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-amber-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        Pular para conteúdo principal
      </a>

      {/* Left Panel - Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-slate-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />

        {/* Geometric pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="diamond" width="120" height="120" patternUnits="userSpaceOnUse">
              <polygon points="60,0 120,60 60,120 0,60" fill="none" stroke="white" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#diamond)" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif font-bold text-3xl tracking-tight">
              PREVI<span className="text-amber-500">ANDO</span>
            </span>
          </div>
        </div>

        <AuthHighlights />

        <div className="relative z-10">
          <p className="font-sans text-sm text-slate-400">
            © {new Date().getFullYear()} Previando.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        id="auth-content"
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-white outline-none"
        tabIndex={-1}
      >
        {/* Mobile Logo */}
        <div className="md:hidden flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center mb-3">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <span className="font-serif font-bold text-3xl text-slate-900 tracking-tight">
            PREVI<span className="text-amber-600">ANDO</span>
          </span>
        </div>

        {/* Mobile value prop */}
        <AuthMobileValue />

        <div className="w-full max-w-sm">
          <AuthTransition>{children}</AuthTransition>
        </div>

        {/* Security badges */}
        <div className="mt-8 flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span className="font-sans text-[10px] font-medium">Criptografado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            <span className="font-sans text-[10px] font-medium">LGPD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" />
            <span className="font-sans text-[10px] font-medium">SSL</span>
          </div>
        </div>
      </div>

      <CookieConsent />
    </div>
  )
}
