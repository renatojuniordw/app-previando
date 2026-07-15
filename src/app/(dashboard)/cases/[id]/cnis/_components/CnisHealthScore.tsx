'use client'

import { useMemo } from 'react'
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, FileWarning } from 'lucide-react'
import type { CnisExtractedData } from '@/types/cnis'

interface Props {
  data: CnisExtractedData
}

interface HealthIssue {
  type: 'erro' | 'atencao' | 'info'
  message: string
}

export function CnisHealthScore({ data }: Props) {
    const { score, grade, issues } = useMemo(() => {
    const issues: HealthIssue[] = []
    let deductions = 0

    if (!data.periodos || data.periodos.length === 0) {
      deductions += 40
      issues.push({ type: 'erro', message: 'Nenhum vínculo encontrado no CNIS' })
    }

    if (data.periodos && data.periodos.length > 0) {
      const allMonths = new Set<string>()
      for (const p of data.periodos) {
        for (const s of p.salarios ?? []) {
          allMonths.add(s.competencia)
        }
      }
      const sorted = Array.from(allMonths).sort()
      let bigGaps = 0
      for (let i = 1; i < sorted.length; i++) {
        const [anoA, mesA] = sorted[i - 1].split('-').map(Number)
        const [anoB, mesB] = sorted[i].split('-').map(Number)
        const diff = (anoB - anoA) * 12 + (mesB - mesA)
        if (diff > 3) bigGaps++
      }
      if (bigGaps > 5) {
        deductions += 20
        issues.push({ type: 'atencao', message: `${bigGaps} gaps acima de 3 meses encontrados` })
      } else if (bigGaps > 0) {
        deductions += 10
        issues.push({ type: 'info', message: `${bigGaps} gaps acima de 3 meses encontrados` })
      }
    }

    const periodsWithIndicators = data.periodos?.filter(p => p.indicadores && p.indicadores.length > 0) ?? []
    if (periodsWithIndicators.length > 0) {
      deductions += 10
      issues.push({ type: 'atencao', message: `${periodsWithIndicators.length} vínculo(s) com indicadores do CNIS` })
    }

    const emptyPeriods = data.periodos?.filter(p => !p.salarios || p.salarios.length === 0) ?? []
    if (emptyPeriods.length > 0) {
      deductions += 10
      issues.push({ type: 'atencao', message: `${emptyPeriods.length} vínculo(s) sem salários registrados` })
    }

    if (data.totalContribuicoes != null && data.totalContribuicoes < 180) {
      deductions += 15
      issues.push({ type: 'atencao', message: `Total de contribuições (${data.totalContribuicoes}) abaixo da carência de 180 meses` })
    }

    if (!data.nome) {
      deductions += 5
      issues.push({ type: 'atencao', message: 'Nome do segurado não extraído' })
    }
    if (!data.nit) {
      deductions += 5
      issues.push({ type: 'atencao', message: 'NIT/PIS não extraído' })
    }

    let salaryIndicators = 0
    for (const p of data.periodos ?? []) {
      for (const s of p.salarios ?? []) {
        if (s.indicadores && s.indicadores.length > 0) {
          salaryIndicators++
        }
      }
    }
    if (salaryIndicators > 0) {
      issues.push({ type: 'info', message: `${salaryIndicators} salário(s) com indicadores` })
    }

    const finalScore = Math.max(0, 100 - deductions)

    let grade: string
    if (finalScore >= 90) {
      grade = 'Excelente'
    } else if (finalScore >= 70) {
      grade = 'Bom'
    } else if (finalScore >= 40) {
      grade = 'Atenção'
    } else {
      grade = 'Crítico'
    }

    return { score: finalScore, grade, issues }
  }, [data])

  const scoreColor = score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-blue-600' : score >= 40 ? 'text-amber-600' : 'text-rose-600'
  const barColor = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        {score >= 70 ? (
          <ShieldCheck className="w-4 h-4 text-slate-500" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-slate-500" />
        )}
        <h3 className="font-serif font-bold text-base text-slate-900">
            Saúde do CNIS
        </h3>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - score / 100)}`}
              className={scoreColor}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-sans font-bold text-xl ${scoreColor}`}>{score}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className={`font-sans font-bold text-lg ${scoreColor}`}>{grade}</p>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            Pontos de Atenção
          </p>
          <div className="space-y-1.5">
            {issues.map((issue, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                  issue.type === 'erro'
                    ? 'bg-rose-50 text-rose-700'
                    : issue.type === 'atencao'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-50 text-slate-600'
                }`}
              >
                {issue.type === 'erro' ? (
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : issue.type === 'atencao' ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <FileWarning className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {issues.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">
            Nenhum problema identificado. O CNIS está em boas condições.
          </p>
        </div>
      )}

      <p className="text-[10px] text-slate-400 leading-relaxed">
        Análise automatizada baseada nos dados extraídos. Sempre verifique o documento original para confirmar.
      </p>
    </div>
  )
}
