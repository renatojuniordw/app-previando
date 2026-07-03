import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
      <div className="max-w-md text-center">
        <h1 className="font-serif font-bold text-6xl text-slate-900 mb-4">404</h1>
        <h2 className="font-serif font-bold text-xl text-slate-900 mb-2">Página não encontrada</h2>
        <p className="font-sans text-sm text-slate-500 mb-6">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-sans font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
