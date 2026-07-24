'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, FileText, Calculator, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react'

const STEPS = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Cadastre seu primeiro cliente',
    description: 'Adicione o segurado com nome, CPF e data de nascimento.',
    href: '/clients/list',
    cta: 'Adicionar cliente',
  },
  {
    step: 2,
    icon: FileText,
    title: 'Envie o CNIS',
    description: 'Faça upload do extrato CNIS para extração automática dos vínculos.',
    href: null,
    cta: 'Acesse o caso → aba CNIS',
  },
  {
    step: 3,
    icon: Calculator,
    title: 'Calcule o benefício',
    description: 'O sistema calcula todas as modalidades com base no CNIS processado.',
    href: null,
    cta: 'Acesse o caso → Cálculos',
  },
  {
    step: 4,
    icon: Sparkles,
    title: 'Gere um parecer com IA',
    description: 'Crie um parecer jurídico completo em segundos com inteligência artificial.',
    href: null,
    cta: 'Acesse o caso → FAB → Parecer',
  },
]

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-colors"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className="mb-5">
        <p className="font-serif font-bold text-xl text-slate-900">Bem-vindo ao Previando!</p>
        <p className="text-sm text-slate-500 mt-1">
          Siga os passos abaixo para processar o seu primeiro caso previdenciário.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {STEPS.map(({ step, icon: Icon, title, description, href, cta }) => (
          <div
            key={step}
            className="bg-white/80 border border-amber-100 rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="font-bold text-sm text-amber-700">{step}</span>
              </div>
              <Icon className="w-4 h-4 text-amber-600" />
            </div>

            <div>
              <p className="font-sans font-semibold text-sm text-slate-800 leading-snug">{title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
            </div>

            {href ? (
              <Link
                href={href}
                className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
              >
                {cta} <ChevronRight className="w-3 h-3" />
              </Link>
            ) : (
              <p className="mt-auto text-xs text-slate-400 italic">{cta}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
        <p className="text-xs text-slate-500">
          Este guia desaparece quando você cadastrar o primeiro cliente, ou pode fechá-lo a qualquer momento.
        </p>
      </div>
    </div>
  )
}
