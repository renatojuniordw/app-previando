'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, RefreshCw, Loader2, Lock,
} from 'lucide-react'

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
  ALTA: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'bg-emerald-500', label: 'Alta probabilidade' },
  MÉDIA: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'bg-amber-500', label: 'Média probabilidade' },
  BAIXA: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', ring: 'bg-red-500', label: 'Baixa probabilidade' },
  INCONCLUSIVO: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', ring: 'bg-slate-400', label: 'Dados insuficientes' },
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
      <Card variant="light" className="p-6 flex items-center gap-4 border-dashed border-slate-300">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="font-sans font-semibold text-sm text-slate-700">Análise de Probabilidade de Êxito</p>
          <p className="text-xs text-slate-400 mt-0.5">Disponível nos planos SOLO e PRO</p>
        </div>
      </Card>
    )
  }

  if (!result && !loading) {
    return (
      <Card variant="light" className="p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-sans font-semibold text-sm text-slate-800">Análise de Probabilidade de Êxito</p>
          <p className="text-xs text-slate-500 mt-0.5">
            IA avalia os dados do caso e retorna um score de 0 a 100 com pontos favoráveis e riscos
          </p>
        </div>
        <button
          onClick={runAnalysis}
          className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Analisar
        </button>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card variant="light" className="p-6 flex items-center gap-4">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin shrink-0" />
        <p className="text-sm text-slate-600">Analisando caso com IA...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="light" className="p-6 flex items-center gap-4 border-red-200">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-600 flex-1">{error}</p>
        <button onClick={runAnalysis} className="text-sm text-amber-600 font-semibold hover:underline">
          Tentar novamente
        </button>
      </Card>
    )
  }

  if (!result) return null

  const cfg = CLASS_CONFIG[result.classification]

  return (
    <Card variant="light" className={`p-6 border ${cfg.border} space-y-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className={`w-5 h-5 ${cfg.color}`} />
          <div>
            <p className="font-sans font-bold text-slate-900">Probabilidade de Êxito</p>
            <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-right rounded-xl px-4 py-2 ${cfg.bg}`}>
            <p className={`font-bold text-3xl ${cfg.color}`}>{result.score}</p>
            <p className="text-xs text-slate-400">/100</p>
          </div>
          <button
            onClick={refresh}
            title="Reanalisar (invalida cache)"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${cfg.ring}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {result.favorable.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide">
              <TrendingUp className="w-3.5 h-3.5" /> Pontos Favoráveis
            </p>
            {result.favorable.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )}
        {result.risks.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wide">
              <TrendingDown className="w-3.5 h-3.5" /> Pontos de Atenção
            </p>
            {result.risks.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {result.recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>Recomendação:</strong> {result.recommendation}
          </p>
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">
        Gerado em {new Date(result.generatedAt).toLocaleString('pt-BR')} · cache de 6h
      </p>
    </Card>
  )
}
