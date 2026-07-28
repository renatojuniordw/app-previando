'use client'

import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import type { CnisExtractedData } from '@/types/cnis'

interface Props {
  data: CnisExtractedData
}

function parseAnoMes(competencia: string): { ano: number; mes: number } {
  const [ano, mes] = competencia.split('-').map(Number)
  return { ano, mes }
}

export function CnisTimeline({ data }: Props) {
  const { anos, totalMeses, contribuicaoMeses, gapMeses, percentual } = useMemo(() => {
    if (!data.periodos || data.periodos.length === 0) {
      return { anos: [], totalMeses: 0, contribuicaoMeses: 0, gapMeses: 0, percentual: 0 }
    }

    const monthsByAno = new Map<number, Set<number>>()
    for (const p of data.periodos) {
      for (const s of p.salarios ?? []) {
        const { ano, mes } = parseAnoMes(s.competencia)
        if (!monthsByAno.has(ano)) monthsByAno.set(ano, new Set())
        monthsByAno.get(ano)!.add(mes)
      }
    }

    if (monthsByAno.size === 0) {
      return { anos: [], totalMeses: 0, contribuicaoMeses: 0, gapMeses: 0, percentual: 0 }
    }

    const sortedAnos = Array.from(monthsByAno.keys()).sort((a, b) => a - b)
    const anos = sortedAnos.map((ano) => {
      const meses = monthsByAno.get(ano)!
      return { ano, meses: meses.size, total: 12 }
    })

    let totalContrib = 0
    for (const p of data.periodos) {
      totalContrib += p.salarios?.length ?? 0
    }

    const firstAno = sortedAnos[0]
    const lastAno = sortedAnos[sortedAnos.length - 1]
    const totalMesesCalc = (lastAno - firstAno + 1) * 12
    const contribMeses = totalContrib
    const gapMesesCalc = totalMesesCalc - contribMeses
    const pct = Math.round((contribMeses / totalMesesCalc) * 100)

    return { anos, totalMeses: totalMesesCalc, contribuicaoMeses: contribMeses, gapMeses: gapMesesCalc, percentual: pct }
  }, [data])

  if (anos.length === 0) return null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-500" />
          <h3 className="font-serif font-bold text-base text-slate-900">
            Timeline de Contribuições
          </h3>
        </div>
        <span className="font-sans text-xs font-bold text-slate-400">
          {contribuicaoMeses}/{totalMeses} meses ({percentual}%)
        </span>
      </div>

      {/* Barra de percentual geral */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percentual}%` }}
          />
        </div>
        <span className="font-sans text-xs font-bold text-slate-500 shrink-0">
          {gapMeses > 0 ? `${gapMeses} meses sem contribuição` : 'Sem gaps'}
        </span>
      </div>

      {/* Grade anual */}
      <div className="overflow-x-auto -mx-1 pb-1">
        <div className="min-w-[500px] space-y-1">
          {anos.map(({ ano, meses, total }) => {
            return (
              <div key={ano} className="flex items-center gap-3">
                <span className="font-mono text-[11px] font-bold text-slate-500 w-10 shrink-0 text-right">
                  {ano}
                </span>
                <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden flex">
                  {Array.from({ length: 12 }, (_, mes) => {
                    const contrib = mes + 1 <= meses
                    return (
                      <div
                        key={mes}
                        className={`flex-1 transition-colors ${
                          contrib
                            ? meses >= 10 ? 'bg-emerald-500' : meses >= 7 ? 'bg-emerald-400' : meses >= 4 ? 'bg-amber-400' : 'bg-rose-300'
                            : 'bg-slate-100'
                        } ${contrib ? 'hover:brightness-110' : ''}`}
                        aria-label={`${ano}-${String(mes + 1).padStart(2, '0')}: ${contrib ? 'Contribuiu' : 'Sem contribuição'}`}
                      />
                    )
                  })}
                </div>
                <span className="font-sans text-[10px] text-slate-400 w-12 shrink-0">
                  {meses}/{total}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">Legenda:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span>Contribuiu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
          <span>Sem contribuição</span>
        </div>
      </div>
    </div>
  )
}
