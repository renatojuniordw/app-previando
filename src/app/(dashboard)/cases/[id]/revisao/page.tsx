'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Scale, TrendingUp, AlertCircle, CheckCircle, Clock,
  FileText, Calculator, History, Info,
} from 'lucide-react'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { REVISION_LABELS } from '@/lib/strategies/revision-types'
import type { RevisionType, RevisionResult } from '@/lib/strategies/revision-types'
import { cn } from '@/lib/utils'

const TIPO_REVISAO: RevisionType = 'REVISAO_BENEFICIO'

interface FormData {
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

function SectionHeader({ icon: Icon, title, badge }: { icon: typeof Scale; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <h3 className="font-serif font-bold text-base text-slate-800 flex-1 min-w-0 truncate">{title}</h3>
      {badge && (
        <span className="font-sans text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
  )
}

function ResultTile({ label, value, tone = 'default' }: {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'accent'
}) {
  return (
    <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 overflow-hidden">
      <span className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
        {label}
      </span>
      <span className={cn(
        'font-mono font-bold text-base sm:text-lg tabular-nums block truncate',
        tone === 'positive' && 'text-emerald-700',
        tone === 'accent' && 'text-amber-700',
        tone === 'default' && 'text-slate-800',
      )}>
        {value}
      </span>
    </div>
  )
}

export default function RevisaoPage() {
  const params = useParams()
  const caseId = params.id as string

  const [form, setForm] = useState<FormData>({ rmiConcedido: '', dibConcedido: '' })
  const [result, setResult] = useState<RevisionResult | null>(null)
  const [history, setHistory] = useState<RevisionHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/cases/${caseId}/revisions`)
      .then((r) => setHistory(r.data.revisions))
      .catch(() => null)
      .finally(() => setLoadingHistory(false))
  }, [caseId])

  useEffect(() => {
    if (form.rmiConcedido) return
    api.get(`/cases/${caseId}/calculations`, { params: { limit: 1 } })
      .then((r) => {
        const selected = r.data.calculations?.find((c: { isSelected: boolean }) => c.isSelected)
        if (selected?.rmi) {
          setForm((prev) => ({ ...prev, rmiConcedido: String(Number(selected.rmi)) }))
        }
      })
      .catch(() => null)
  }, [caseId, form.rmiConcedido])

  const handleSubmit = async () => {
    setError('')
    setResult(null)

    if (!form.rmiConcedido || !form.dibConcedido) {
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
        tipoRevisao: TIPO_REVISAO,
        rmiConcedido: rmi,
        dibConcedido: form.dibConcedido,
      })
      setResult(res.data)

      const hist = await api.get(`/cases/${caseId}/revisions`)
      setHistory(hist.data.revisions)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao calcular revisão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Revisão de Benefícios</h2>
          <p className="font-sans text-sm text-slate-500 mt-1 leading-relaxed">
            Calcule o impacto da revisão do benefício concedido com base nos dados atuais do CNIS.
          </p>
        </div>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Área Principal */}
        <div className="xl:col-span-2 space-y-6">

          {/* Formulário */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <SectionHeader icon={Calculator} title="Nova Simulação de Revisão" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <CurrencyInput
                value={form.rmiConcedido ? parseFloat(form.rmiConcedido) : ''}
                onChange={(val) => setForm({ ...form, rmiConcedido: String(val) })}
                label="RMI Concedido"
                placeholder="Ex: 1.518,00"
              />
              <label className="block">
                <span className="neo-label">DIB Concedida</span>
                <DatePicker
                  value={form.dibConcedido}
                  onChange={(d) => setForm({ ...form, dibConcedido: d ? d.toISOString().split('T')[0] : '' })}
                />
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl" role="alert">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
                <span className="font-sans text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-slate-100">
              <p className="font-sans text-xs text-slate-400 leading-relaxed" aria-live="polite">
                A simulação será salva automaticamente no histórico.
              </p>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                className="w-full md:w-auto shrink-0 bg-amber-600 hover:bg-amber-700 border-amber-600"
              >
                <Scale className="w-4 h-4" aria-hidden="true" />
                {loading ? 'Calculando...' : 'Calcular Revisão'}
              </Button>
            </div>
          </div>

          {/* Loading do cálculo */}
          {loading && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* Resultado */}
          {result && !loading && (
            <>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                <SectionHeader icon={FileText} title={REVISION_LABELS[result.tipoRevisao]} />

                {!result.elegivel ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
                      <h4 className="font-sans font-bold text-sm text-amber-800">Revisão não aplicável</h4>
                    </div>
                    <ul className="list-disc list-inside font-sans text-sm text-amber-700 space-y-1">
                      {result.pendencias.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <ResultTile label="Benefício Atual" value={formatCurrency(result.rmiConcedido)} />
                      <ResultTile label="Benefício Revisado" value={formatCurrency(result.rmiRevisado)} tone="positive" />
                      <ResultTile label="Diferença Percentual" value={`+${result.diferencaPercentual.toFixed(2)}%`} tone="accent" />
                      <ResultTile label="Diferença Mensal" value={`+${formatCurrency(result.diferencaMensal)}`} tone="positive" />
                    </div>

                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                          <TrendingUp className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <h4 className="font-sans font-bold text-sm text-amber-900">Impacto Retroativo (5 anos)</h4>
                      </div>
                      <span className="font-mono font-bold text-xl sm:text-2xl text-amber-800 tabular-nums block">
                        {formatCurrency(result.retroativos5Anos)}
                      </span>
                      <p className="font-sans text-xs text-amber-700 mt-1 leading-relaxed">
                        Valor estimado com correção monetária aproximada (INPC médio).
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Memória de Cálculo */}
              {result.elegivel && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                  <SectionHeader icon={Calculator} title="Memória de Cálculo" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ResultTile label="SB Original" value={formatCurrency(result.memoriaCalculo.salarioBeneficioOriginal)} />
                    <ResultTile label="SB Revisado" value={formatCurrency(result.memoriaCalculo.salarioBeneficioRevisado)} />
                    <ResultTile label="Coeficiente Aplicado" value={`${(result.memoriaCalculo.coeficienteAplicado * 100).toFixed(1)}%`} />
                    <ResultTile label="Contribuições Consideradas" value={String(result.memoriaCalculo.contribuicoesConsideradasRevisao)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">

          {/* Sobre */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <SectionHeader icon={Info} title="Sobre a Revisão" />
            <p className="font-sans text-xs text-slate-500 leading-relaxed">
              Calcule o impacto da revisão no benefício já concedido. Preencha os dados
              originais da concessão (RMI e DIB). O resultado mostra
              a diferença mensal e o impacto retroativo estimado.
            </p>
          </div>

          {/* Histórico */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <SectionHeader
              icon={History}
              title="Revisões Anteriores"
              badge={loadingHistory ? undefined : `${history.length} ${history.length === 1 ? 'revisão' : 'revisões'}`}
            />

            {loadingHistory ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-6 text-center">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="font-sans text-xs text-slate-500 leading-relaxed">
                  Nenhuma revisão calculada ainda. Simule a primeira ao lado.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      {item.elegivel ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-bold text-xs text-slate-800 leading-snug">
                          {REVISION_LABELS[item.tipoRevisao]}
                        </h4>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="font-mono text-[11px] font-bold text-emerald-700 tabular-nums">
                            +{formatCurrency(item.diferencaMensal)}/mês
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
