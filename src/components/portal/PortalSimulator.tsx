'use client'

import { useState } from 'react'
import { TrendingUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { DatePicker } from '@/components/ui/DatePicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatCurrency } from '@/lib/utils'

interface SimulacaoResult {
  atual: { rmi: number; elegivel: boolean; idade: number; tempoContribuicao: number }
  projetado: { rmi: number; elegivel: boolean; idade: number; tempoContribuicao: number; dib: string; mesesContribuicaoFutura: number; totalInvestido: number }
  ganho: number
}

interface PortalSimulatorProps {
  token: string
}

export function PortalSimulator({ token }: PortalSimulatorProps) {
  const [dibProjetada, setDibProjetada] = useState('')
  const [valorContribuicao, setValorContribuicao] = useState(1621)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulacaoResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSimulate = async () => {
    if (!dibProjetada || !valorContribuicao) {
      setError('Preencha todos os campos.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data } = await api.post(`/portal/${token}/simulate`, { dibProjetada, valorContribuicao })
      setResult(data)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } }
      setError(apiError.response?.data?.error ?? 'Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <TrendingUp className="w-4 h-4" aria-hidden="true" />
        <span className="font-sans text-sm font-medium uppercase tracking-wide">
          Simulador &quot;E se?&quot;
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Simule como suas contribuições futuras podem aumentar o valor do benefício.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <DatePicker
            label="Data pretendida"
            value={dibProjetada}
            onChange={(d) => setDibProjetada(d ? d.toISOString().split('T')[0] : '')}
            minDate={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <CurrencyInput
            value={valorContribuicao}
            onChange={(val) => setValorContribuicao(val)}
            label="Contribuição mensal (R$)"
            min={0}
            placeholder="Ex: 1.621,00"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      <button
        onClick={handleSimulate}
        disabled={loading || !dibProjetada || !valorContribuicao}
        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Simulando...</>
        ) : (
          <><TrendingUp className="w-4 h-4" /> Simular Cenário</>
        )}
      </button>

      {result && (
        <div className="space-y-3 pt-2 border-t border-slate-100 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">RMI Hoje</p>
              <p className="font-bold text-lg text-slate-500">{formatCurrency(result.atual.rmi)}</p>
              <p className="text-[10px] text-slate-400">{result.atual.elegivel ? '✅ Elegível' : '⏳ Pendente'}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700 mb-1">RMI na Data</p>
              <p className="font-bold text-lg text-amber-700">{formatCurrency(result.projetado.rmi)}</p>
              <p className="text-[10px] text-amber-600">{result.projetado.mesesContribuicaoFutura} meses futuros</p>
            </div>
          </div>

          {result.ganho > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Ganho mensal</span>
              </div>
              <span className="font-bold text-lg text-emerald-600">+ {formatCurrency(result.ganho)}/mês</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <span className="font-medium text-slate-700 block">Total investido:</span>
              <span>{formatCurrency(result.projetado.totalInvestido)}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700 block">Idade na data:</span>
              <span>{result.projetado.idade} anos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
