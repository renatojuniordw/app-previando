'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calculator, FileText, Globe, BarChart3, Sparkles } from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: Calculator,
    title: 'Cálculos Automáticos',
    description: 'Calcule RMI, RMA e retroativos de todas as modalidades previdenciárias em segundos.',
  },
  {
    icon: FileText,
    title: 'CNIS Inteligente',
    description: 'Upload do extrato CNIS e extração automática de vínculos, salários e indicadores com IA.',
  },
  {
    icon: Globe,
    title: 'Portal do Cliente',
    description: 'Compartilhe cálculos, documentos e análises com segurança via link único.',
  },
  {
    icon: BarChart3,
    title: 'Simulador "E se?"',
    description: 'Projete cenários futuros de aposentadoria e compare resultados em tempo real.',
  },
]

export function AuthHighlights() {
  const [active, setActive] = useState(0)

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % HIGHLIGHTS.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <div className="relative z-10 space-y-4" role="region" aria-label="Funcionalidades do Previando">
      {/* Carrossel com fade */}
      <div className="relative min-h-[140px]">
        {HIGHLIGHTS.map((item, i) => (
          <div
            key={i}
            className={`absolute inset-0 flex items-start gap-4 p-4 rounded-xl transition-all duration-500 ${
              i === active
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={i !== active}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="font-sans font-bold text-white text-sm leading-tight">
                {item.title}
              </p>
              <p className="font-sans text-slate-300 text-xs mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Dots de navegação */}
      <div className="flex items-center gap-2" role="tablist" aria-label="Navegação de funcionalidades">
        {HIGHLIGHTS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Funcionalidade ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              i === active ? 'w-6 bg-amber-500' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>

      {/* Tagline */}
      <p className="flex items-center gap-1.5 font-sans text-xs text-slate-400">
        <Sparkles className="w-3 h-3 text-amber-500" />
        Tudo que você precisa para uma previdência eficiente
      </p>
    </div>
  )
}
