'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Scale, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign, Percent, FileText } from 'lucide-react'
import { REVISION_LABELS, REVISION_DESCRIPTIONS } from '@/lib/strategies/revision-types'
import type { RevisionType, RevisionResult } from '@/lib/strategies/revision-types'

const REVISAO_TYPES: RevisionType[] = ['REVISAO_VIDA_TODA', 'REVISAO_ART_29', 'REVISAO_BURACO_NEGRO']

interface FormData {
  tipoRevisao: RevisionType | ''
  rmiConcedido: string
  dibConcedido: string
}

interface RevisionHistoryItem {
  id: string
  tipoRevisao: RevisionType
  rmiConcedido: number
  rmiRevisado: number
  diferencaMensal: number
  diferencaPercentual: number
  elegivel: boolean
  createdAt: string
}

export default function RevisaoPage() {
  const params = useParams()
  const caseId = params.id as string

  const [form, setForm] = useState<FormData>({ tipoRevisao: '', rmiConcedido: '', dibConcedido: '' })
  const [result, setResult] = useState<RevisionResult | null>(null)
  const [history, setHistory] = useState<RevisionHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  // Carregar histórico
  useState(() => {
    api.get(`/cases/${caseId}/revisions`)
      .then((r) => setHistory(r.data.revisions))
      .catch(() => null)
      .finally(() => setLoadingHistory(false))
  })

  const handleSubmit = async () => {
    setError('')
    setResult(null)

    if (!form.tipoRevisao || !form.rmiConcedido || !form.dibConcedido) {
      setError('Preencha todos os campos.')
      return
    }

    const rmi = Number(form.rmiConcedido)
    if (rmi <= 0 || isNaN(rmi)) {
      setError('RMI concedido deve ser um valor positivo.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post(`/cases/${caseId}/revisions`, {
        tipoRevisao: form.tipoRevisao,
        rmiConcedido: rmi,
        dibConcedido: form.dibConcedido,
      })
      setResult(res.data)

      // Atualiza histórico
      const hist = await api.get(`/cases/${caseId}/revisions`)
      setHistory(hist.data.revisions)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao calcular revisão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-600" />
            Revisão de Benefícios
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Calcule o impacto de diferentes tipos de revisão no benefício concedido.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
          <Clock className="w-4 h-4 mr-1" />
          Histórico ({history.length})
        </Button>
      </div>

      {/* Histórico */}
      {showHistory && (
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Revisões Anteriores</h3>
          {loadingHistory ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma revisão encontrada.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {item.elegivel ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-300" />
                    )}
                    <span className="font-medium">{REVISION_LABELS[item.tipoRevisao]}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Dif: R$ {item.diferencaMensal.toFixed(2)}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Formulário */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Nova Simulação de Revisão</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {REVISAO_TYPES.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setForm({ ...form, tipoRevisao: form.tipoRevisao === tipo ? '' : tipo })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                form.tipoRevisao === tipo
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="font-medium text-sm text-slate-900 block">{REVISION_LABELS[tipo]}</span>
              <span className="text-xs text-slate-500 mt-1 block leading-relaxed">
                {REVISION_DESCRIPTIONS[tipo]}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RMI Concedido (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.rmiConcedido}
              onChange={(e) => setForm({ ...form, rmiConcedido: e.target.value })}
              placeholder="Ex: 1518.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DIB Concedida</label>
            <input
              type="date"
              value={form.dibConcedido}
              onChange={(e) => setForm({ ...form, dibConcedido: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || !form.tipoRevisao}
          className="w-full md:w-auto"
        >
          {loading ? 'Calculando...' : 'Calcular Revisão'}
        </Button>
      </Card>

      {/* Resultado */}
      {result && (
        <div className="space-y-4">
          {/* Comparativo */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              {REVISION_LABELS[result.tipoRevisao]}
            </h3>

            {!result.elegivel ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">Revisão não aplicável</span>
                </div>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  {result.pendencias.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <DollarSign className="w-3 h-3" />
                      Benefício Atual
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      R$ {result.rmiConcedido.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Benefício Revisado
                    </div>
                    <span className="text-xl font-bold text-green-700">
                      R$ {result.rmiRevisado.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
                      <Percent className="w-3 h-3" />
                      Diferença Percentual
                    </div>
                    <span className="text-xl font-bold text-amber-700">
                      +{result.diferencaPercentual.toFixed(2)}%
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                      <DollarSign className="w-3 h-3" />
                      Diferença Mensal
                    </div>
                    <span className="text-xl font-bold text-blue-700">
                      +R$ {result.diferencaMensal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Impacto Retroativo (5 anos)</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-700">
                    R$ {result.retroativos5Anos.toFixed(2)}
                  </span>
                  <p className="text-xs text-purple-600 mt-1">
                    Valor estimado com correção monetária aproximada (INPC médio).
                  </p>
                </div>
              </>
            )}
          </Card>

          {/* Memória de Cálculo */}
          {result.elegivel && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-3">Memória de Cálculo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block">SB Original</span>
                  <span className="font-medium">R$ {result.memoriaCalculo.salarioBeneficioOriginal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SB Revisado</span>
                  <span className="font-medium">R$ {result.memoriaCalculo.salarioBeneficioRevisado.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Coeficiente</span>
                  <span className="font-medium">{(result.memoriaCalculo.coeficienteAplicado * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contribuições</span>
                  <span className="font-medium">{result.memoriaCalculo.contribuicoesConsideradasRevisao}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      )}
    </div>
  )
}
