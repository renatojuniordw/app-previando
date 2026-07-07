import Link from 'next/link'
import { Scale } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight">
              PREVI<span className="text-amber-500">ANDO</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 font-sans text-sm text-slate-300">
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <p className="font-sans text-sm text-slate-500">
            © {new Date().getFullYear()} Previando.
          </p>
        </div>
      </footer>
    </div>
  )
}
