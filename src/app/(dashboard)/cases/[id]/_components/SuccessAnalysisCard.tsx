'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, RefreshCw, Loader2, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisResult {
  score: number
  classification: 'ALTA' | 'MÉDIA' | 'BAIXA' | 'INCONCLUSIVO'
  favorable: string[]
  risks: string[]
  recommendation: string
  generatedAt: string
}

interface Props {
  caseId: string
  hasDiagnosis: boolean
}

const CLASS_CONFIG = {
  ALTA: { color: 'text-emerald-700', bg: 'bg-emerald-50/70 border-emerald-150', border: 'border-emerald-200', ring: 'bg-emerald-500', label: 'Alta probabilidade' },
  MÉDIA: { color: 'text-amber-700', bg: 'bg-amber-50/70 border-amber-150', border: 'border-amber-200', ring: 'bg-amber-500', label: 'Média probabilidade' },
  BAIXA: { color: 'text-red-700', bg: 'bg-red-50/70 border-red-150', border: 'border-red-200', ring: 'bg-red-500', label: 'Baixa probabilidade' },
  INCONCLUSIVO: { color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', border: 'border-slate-250', ring: 'bg-slate-400', label: 'Dados insuficientes' },
}

export function SuccessAnalysisCard({ caseId, hasDiagnosis }: Props) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const r = await api.post(`/cases/${caseId}/success-analysis`)
      setResult(r.data)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err?.response?.data?.error ?? 'Erro ao gerar análise.')
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    await api.delete(`/cases/${caseId}/success-analysis`)
    await runAnalysis()
  }

  if (!hasDiagnosis) {
    return (
      <Card variant="light" className="p-6 flex items-center gap-4 border-dashed border-slate-300/80 bg-slate-50/10 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          <Lock className="w-4.5 h-4.5 text-slate-450" />
        </div>
        <div>
          <p className="font-sans font-bold text-sm text-slate-800">Análise de Probabilidade de Êxito</p>
          <p className="font-sans text-xs text-slate-450 mt-0.5 font-medium">Disponível apenas nos planos SOLO e PRO.</p>
        </div>
      </Card>
    )
  }

  if (!result && !loading) {
    return (
      <Card variant="light" className="p-6 flex flex-col sm:flex-row items-center gap-4 border-slate-200/80 shadow-sm bg-white hover:border-slate-350 transition-all duration-300">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-sans font-bold text-sm text-slate-800">Análise de Probabilidade de Êxito</p>
          <p className="font-sans text-xs text-slate-500 mt-1 leading-relaxed font-medium">
            Nossa Inteligência Artificial analisa o perfil do segurado para projetar a classificação de êxito e apontar possíveis riscos ou pontos favoráveis.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          className="shrink-0 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
        >
          Iniciar Análise
        </button>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card variant="light" className="p-8 flex flex-col items-center justify-center gap-4 border-slate-200/80 shadow-sm bg-white">
        <Loader2 className="w-7 h-7 text-amber-500 animate-spin shrink-0" />
        <p className="font-sans text-xs text-slate-500 font-medium animate-pulse">Processando análise com IA...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="light" className="p-6 flex items-center justify-between gap-4 border-red-200 shadow-sm bg-white">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="font-sans text-sm text-red-700 font-medium">{error}</p>
        </div>
        <button onClick={runAnalysis} className="text-xs text-amber-600 font-bold hover:text-amber-700 transition-colors">
          Tentar novamente
        </button>
      </Card>
    )
  }

  if (!result) return null

  const cfg = CLASS_CONFIG[result.classification]

  return (
    <Card variant="light" className="p-6 border-slate-200/85 bg-white shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            <Sparkles className={cn("w-5 h-5", cfg.color)} />
          </div>
          <div>
            <p className="font-sans font-bold text-sm text-slate-850">Probabilidade de Êxito</p>
            <p className={cn("text-xs font-extrabold uppercase tracking-wider mt-0.5", cfg.color)}>{cfg.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("text-right rounded-lg px-4.5 py-1.5 border shadow-xs flex items-baseline gap-1", cfg.bg)}>
            <p className={cn("font-mono font-bold text-3xl", cfg.color)}>{result.score}</p>
            <p className="text-[10px] text-slate-450 font-bold font-mono">/100</p>
          </div>
          <button
            onClick={refresh}
            title="Reanalisar"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", cfg.ring)}
          style={{ width: `${result.score}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {result.favorable.length > 0 && (
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> Pontos Favoráveis
            </p>
            <div className="space-y-2.5">
              {result.favorable.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-655 leading-relaxed font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {result.risks.length > 0 && (
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-750 uppercase tracking-wider">
              <TrendingDown className="w-3.5 h-3.5" /> Pontos de Atenção
            </p>
            <div className="space-y-2.5">
              {result.risks.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-655 leading-relaxed font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {result.recommendation && (
        <div className="bg-blue-50/40 border border-blue-150 rounded-xl p-4">
          <p className="text-xs text-slate-655 leading-relaxed font-medium">
            <strong className="text-blue-800 font-bold uppercase tracking-wider text-[9px] block mb-1">Recomendação Legal</strong> 
            {result.recommendation}
          </p>
        </div>
      )}

      <p className="text-[10px] text-slate-400 font-mono text-right font-medium">
        Gerado em {new Date(result.generatedAt).toLocaleString('pt-BR')} · Cache de 6h
      </p>
    </Card>
  )
}
