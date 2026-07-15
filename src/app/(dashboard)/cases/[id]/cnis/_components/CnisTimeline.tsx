'use client'

import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import type { CnisExtractedData } from '@/types/cnis'

interface Props {
  data: CnisExtractedData
}

interface TimelineSegment {
  type: 'contribuicao' | 'gap'
  start: string
  end: string
  label: string
  empregador?: string
}

function parseAnoMes(competencia: string): number {
  const [ano, mes] = competencia.split('-').map(Number)
  return ano * 12 + (mes - 1)
}

function formatAnoMes(valor: number): string {
  const ano = Math.floor(valor / 12)
  const mes = (valor % 12) + 1
  return `${ano}-${String(mes).padStart(2, '0')}`
}

export function CnisTimeline({ data }: Props) {
  const [showAll, setShowAll] = useState(false)

  const { segments, totalMeses, contribuicaoMeses, gapMeses, percentual } = useMemo(() => {
    if (!data.periodos || data.periodos.length === 0) {
      return { segments: [], totalMeses: 0, contribuicaoMeses: 0, gapMeses: 0, percentual: 0 }
    }

    // Collect all salary months across all periods
    const allMonths = new Set<number>()
    for (const p of data.periodos) {
      for (const s of p.salarios ?? []) {
        allMonths.add(parseAnoMes(s.competencia))
      }
    }

    if (allMonths.size === 0) {
      return { segments: [], totalMeses: 0, contribuicaoMeses: 0, gapMeses: 0, percentual: 0 }
    }

    const sorted = Array.from(allMonths).sort((a, b) => a - b)
    const minMonth = sorted[0]
    const maxMonth = sorted[sorted.length - 1]
    const totalMeses = maxMonth - minMonth + 1

    // Build segments: contribution blocks + gaps
    const contribuicaoSet = new Set(sorted)
    const segments: TimelineSegment[] = []
    let i = minMonth
    while (i <= maxMonth) {
      if (contribuicaoSet.has(i)) {
        const segStart = i
        let segEnd = i
        const employersInBlock = new Set<string>()
        // Find the end of this contribution block
        while (i <= maxMonth && contribuicaoSet.has(i)) {
          // Find which employer(s) for this month
          for (const p of data.periodos ?? []) {
            for (const s of p.salarios ?? []) {
              if (parseAnoMes(s.competencia) === i) {
                employersInBlock.add(p.empregador || 'Sem identificação')
              }
            }
          }
          segEnd = i
          i++
        }
        const meses = segEnd - segStart + 1
        const label = meses >= 12
          ? `${Math.floor(meses / 12)}a ${meses % 12}m`
          : `${meses}m`
        segments.push({
          type: 'contribuicao',
          start: formatAnoMes(segStart),
          end: formatAnoMes(segEnd),
          label,
          empregador: employersInBlock.size > 0 ? Array.from(employersInBlock).join(', ') : undefined,
        })
      } else {
        const gapStart = i
        while (i <= maxMonth && !contribuicaoSet.has(i)) {
          i++
        }
        const gapEnd = i - 1
        const meses = gapEnd - gapStart + 1
        segments.push({
          type: 'gap',
          start: formatAnoMes(gapStart),
          end: formatAnoMes(gapEnd),
          label: meses >= 12
            ? `${Math.floor(meses / 12)}a ${meses % 12}m`
            : `${meses}m`,
        })
      }
    }

    const contribuicaoMeses = sorted.length
    const gapMeses = totalMeses - contribuicaoMeses
    const percentual = Math.round((contribuicaoMeses / totalMeses) * 100)

    return { segments, totalMeses, contribuicaoMeses, gapMeses, percentual }
  }, [data])

  if (segments.length === 0) {
    return null
  }

  const maxSegments = showAll ? segments.length : 20

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
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

      {/* Mini barra de percentual */}
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

      {/* Timeline horizontal */}
      <div className="overflow-x-auto pb-2 -mx-1">
        <div className="relative min-w-[600px] px-1">
          <div className="flex items-end gap-0.5" style={{ height: '48px' }}>
            {segments.slice(0, maxSegments).map((seg, i) => {
              const width = Math.max(4, 100 / segments.length)
              const isGap = seg.type === 'gap'
              return (
                <div
                  key={i}
                  className="group relative flex flex-col items-center justify-end transition-all"
                  style={{ width: `${width}%`, minWidth: '4px' }}
                >
                  <div
                    className={`w-full rounded-t transition-all duration-200 ${
                      isGap
                        ? 'bg-rose-200 hover:bg-rose-300'
                        : 'bg-emerald-400 hover:bg-emerald-500'
                    }`}
                    style={{ height: isGap ? '24px' : '48px' }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${
                      isGap ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <p className="font-bold">{isGap ? 'Gap' : seg.empregador || 'Contribuição'}</p>
                      <p>{seg.start} a {seg.end}</p>
                      <p className="font-bold">{seg.label}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[10px] text-slate-400">{segments[0]?.start}</span>
            <span className="font-sans text-[10px] text-slate-400">{segments[segments.length - 1]?.end}</span>
          </div>
        </div>
      </div>

      {segments.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
        >
          {showAll ? 'Mostrar menos' : `Mostrar todos (${segments.length} segmentos)`}
        </button>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span>Contribuição</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-rose-200" />
          <span>Gap</span>
        </div>
      </div>
    </div>
  )
}
