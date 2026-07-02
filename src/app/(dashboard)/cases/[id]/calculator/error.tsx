'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 text-center">
      <h2 className="font-serif font-bold text-xl mb-2">Erro ao carregar calculadora</h2>
      <p className="text-slate-600 mb-4">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-slate-900 text-white rounded-lg">
        Tentar novamente
      </button>
    </div>
  )
}
