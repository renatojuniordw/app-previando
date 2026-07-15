'use client'

import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'previando-cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      role="alert"
      aria-label="Aviso de cookies"
    >
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 md:p-5 flex items-start gap-3 md:gap-4">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-bold text-white">
            Uso de cookies
          </p>
          <p className="font-sans text-xs text-slate-400 mt-1 leading-relaxed">
            Utilizamos cookies estritamente necessários para o funcionamento da plataforma
            (autenticação e segurança). Nenhum dado é compartilhado com terceiros para
            fins de rastreamento ou publicidade. Ao continuar navegando, você concorda com
            o uso desses cookies essenciais.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={dismiss}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Entendi
            </button>
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-300 font-medium transition-colors"
            >
              Saiba mais
            </a>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          aria-label="Fechar aviso de cookies"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}
