'use client'

import { Calculator, FileText, Globe, BarChart3 } from 'lucide-react'

const ITEMS = [
  { icon: Calculator, label: 'Cálculos automáticos' },
  { icon: FileText, label: 'CNIS com IA' },
  { icon: Globe, label: 'Portal do cliente' },
  { icon: BarChart3, label: 'Simulador "E se?"' },
]

export function AuthMobileValue() {
  return (
    <div className="md:hidden w-full max-w-sm mb-6">
      <p className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
        Por que Previando?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <item.icon className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <span className="font-sans text-[11px] text-slate-700 leading-tight">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
