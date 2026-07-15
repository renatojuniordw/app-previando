'use client'

import { useState } from 'react'
import { ChevronDown, Calculator, FileText, Globe, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { icon: Calculator, label: 'Cálculos automáticos de benefícios' },
  { icon: FileText, label: 'Extração inteligente do CNIS com IA' },
  { icon: Globe, label: 'Portal do cliente com compartilhamento seguro' },
  { icon: BarChart3, label: 'Simulador "E se?" para projeções' },
]

export function AuthMobileValue() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden w-full max-w-sm mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left"
      >
        <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider">
          Por que Previando?
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-80 mt-2' : 'max-h-0'
        )}
      >
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          {ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-amber-700" />
              </div>
              <span className="font-sans text-sm text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
