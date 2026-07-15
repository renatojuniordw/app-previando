'use client'

import { Calculator, Briefcase, CalendarDays, TrendingUp, Clock, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CnisExtractedData } from '@/types/cnis'

interface Props {
  data: CnisExtractedData
}

function calcularMediaSalarial(data: CnisExtractedData): number {
  let total = 0
  let count = 0
  for (const p of data.periodos ?? []) {
    for (const s of p.salarios ?? []) {
      total += s.valor
      count++
    }
  }
  return count > 0 ? total / count : 0
}

function calcularMaiorSalario(data: CnisExtractedData): number {
  let max = 0
  for (const p of data.periodos ?? []) {
    for (const s of p.salarios ?? []) {
      if (s.valor > max) max = s.valor
    }
  }
  return max
}

function calcularMaiorGap(data: CnisExtractedData): string | null {
  const allCompetencias: string[] = []
  for (const p of data.periodos ?? []) {
    for (const s of p.salarios ?? []) {
      allCompetencias.push(s.competencia)
    }
  }
  if (allCompetencias.length < 2) return null
  allCompetencias.sort()
  let maxGap = 0
  for (let i = 1; i < allCompetencias.length; i++) {
    const [anoA, mesA] = allCompetencias[i - 1].split('-').map(Number)
    const [anoB, mesB] = allCompetencias[i].split('-').map(Number)
    const diff = (anoB - anoA) * 12 + (mesB - mesA)
    if (diff > maxGap) {
      maxGap = diff
    }
  }
  if (maxGap <= 1) return null
  const anos = Math.floor(maxGap / 12)
  const meses = maxGap % 12
  if (anos > 0 && meses > 0) return `${anos}a ${meses}m`
  if (anos > 0) return `${anos}a`
  return `${meses}m`
}

export function CnisStatsCard({ data }: Props) {
  const totalEmpregadores = data.periodos?.length ?? 0
  const totalContribuicoes = data.totalContribuicoes ?? 0
  const mediaSalarial = calcularMediaSalarial(data)
  const maiorSalario = calcularMaiorSalario(data)
  const maiorGap = calcularMaiorGap(data)

  const stats = [
    {
      icon: Briefcase,
      label: 'Empregadores',
      value: String(totalEmpregadores),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Calculator,
      label: 'Contribuições',
      value: `${totalContribuicoes} meses`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: TrendingUp,
      label: 'Média Salarial',
      value: formatCurrency(mediaSalarial),
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: Award,
      label: 'Maior Salário',
      value: formatCurrency(maiorSalario),
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: Clock,
      label: 'Período Total',
      value: data.primeiraContribuicao && data.ultimaContribuicao
        ? `${data.primeiraContribuicao} a ${data.ultimaContribuicao}`
        : '—',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      icon: CalendarDays,
      label: 'Maior Gap',
      value: maiorGap ?? 'Nenhum',
      color: maiorGap ? 'text-rose-600' : 'text-slate-400',
      bg: maiorGap ? 'bg-rose-50' : 'bg-slate-50',
    },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-serif font-bold text-base text-slate-900 mb-4">
        Resumo do CNIS
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-xl p-3 space-y-1.5`}
          >
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
            </div>
            <p className={`font-sans font-bold text-sm ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
