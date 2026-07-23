'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, TrendingUp, Plus, Trash2, BarChart3, CheckCircle2, XCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ModalitySelect } from '@/components/case/ModalitySelect'
import { useCaseData } from '../_components/CaseContext'
import { MODALIDADES_PADRAO, mapToPortugueseCode, getModalityLabel } from '@/lib/modalidade-labels'
import { formatCurrency } from '@/lib/utils'
import { isValid } from 'date-fns'

interface ScenarioInput {
  label: string
  dib: Date | null
  valorContribuicaoFutura: number
  modalidade: string
}

interface ScenarioResult {
  label: string
  modalidade: string
  dib: string
  rmi: number
  rma: number
  gainVsNow: number
  idade: number
  tempoContribuicaoAnos: number
  elegivel: boolean
}

interface ModalidadeOption {
  codigo: string
  label: string
}

const DEFAULT_MODALIDADE = 'APOSENTADORIA_IDADE'

const INITIAL_SCENARIOS: ScenarioInput[] = [
  { label: 'Cenário 1', dib: null, valorContribuicaoFutura: 1412, modalidade: DEFAULT_MODALIDADE },
  { label: 'Cenário 2', dib: null, valorContribuicaoFutura: 1412, modalidade: DEFAULT_MODALIDADE },
]

function toDateString(d: Date | null): string {
  if (!d || !isValid(d)) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ScenariosComparisonPage() {
  const { id } = useParams<{ id: string }>()
  const { data: caseData } = useCaseData()

  const [scenarios, setScenarios] = useState<ScenarioInput[]>(INITIAL_SCENARIOS)
  const [results, setResults] = useState<ScenarioResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRmi, setCurrentRmi] = useState<number | null>(null)
  const [modalidades, setModalidades] = useState<ModalidadeOption[]>([])

  // Fetch modalidades
  useEffect(() => {
    async function fetchModalidades() {
      try {
        const r = await api.get('/modalidades')
        const mapped = (r.data.modalidades ?? []).map((m: { codigo: string; label: string }) => ({
          ...m,
          codigo: mapToPortugueseCode(m.codigo),
        }))
        setModalidades(mapped)
      } catch {
        setModalidades(MODALIDADES_PADRAO)
      }
    }
    fetchModalidades()
  }, [])

  // Fetch the current calculation for baseline
  useEffect(() => {
    async function fetchCurrentCalculation() {
      try {
        const r = await api.get(`/cases/${id}/calculations`)
        const calculations = r.data?.calculations ?? r.data ?? []
        if (Array.isArray(calculations) && calculations.length > 0) {
          const latest = calculations[0]
          setCurrentRmi(latest.rmi ?? latest.rmiProjected ?? null)
        }
      } catch {
        // Silently fail — baseline is optional
      }
    }
    fetchCurrentCalculation()
  }, [id])

  const allModalidades = modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO
  const benefitType = caseData?.benefitType as string | undefined ?? null

  const handleAddScenario = useCallback(() => {
    if (scenarios.length >= 5) return
    const idx = scenarios.length + 1
    setScenarios((prev) => [
      ...prev,
      { label: `Cenário ${idx}`, dib: null, valorContribuicaoFutura: 1412, modalidade: DEFAULT_MODALIDADE },
    ])
  }, [scenarios.length])

  const handleRemoveScenario = useCallback((index: number) => {
    if (scenarios.length <= 2) return
    setScenarios((prev) => prev.filter((_, i) => i !== index))
    setResults(null)
    setError(null)
  }, [scenarios.length])

  const handleChange = useCallback(
    (index: number, field: keyof ScenarioInput, value: unknown) => {
      setScenarios((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
      )
      setResults(null)
      setError(null)
    },
    []
  )

  const addBaseline = useCallback(() => {
    const baselineLabel = 'Cenário Atual'
    const alreadyExists = scenarios.some((s) => s.label === baselineLabel)
    if (alreadyExists) return

    const newScenario: ScenarioInput = {
      label: baselineLabel,
      dib: new Date(),
      valorContribuicaoFutura: 0,
      modalidade: 'APOSENTADORIA_IDADE',
    }

    if (scenarios.length >= 5) {
      setScenarios((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = newScenario
        return updated
      })
    } else {
      setScenarios((prev) => [...prev, newScenario])
    }
    setResults(null)
    setError(null)
  }, [scenarios])

  const handleCompare = useCallback(async () => {
    const invalidIndex = scenarios.findIndex((s) => !s.dib || !isValid(s.dib))
    if (invalidIndex >= 0) {
      setError(`Preencha a DIB do "${scenarios[invalidIndex].label}"`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        scenarios: scenarios.map((s) => ({
          label: s.label,
          dib: toDateString(s.dib),
          valorContribuicaoFutura: s.valorContribuicaoFutura,
          modalidade: s.modalidade,
        })),
      }

      const r = await api.post(`/cases/${id}/scenarios`, payload)
      setResults(r.data.scenarios)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error ?? 'Erro ao comparar cenários.')
      } else {
        setError('Erro ao comparar cenários.')
      }
    } finally {
      setLoading(false)
    }
  }, [id, scenarios])

  // Build chart data including baseline if available
  const chartData =
    results?.map((r) => ({
      name: r.label,
      RMI: r.rmi,
      ...(currentRmi !== null ? { 'RMI Atual': currentRmi } : {}),
    })) ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
          <BarChart3 className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Comparação de Cenários
          </h1>
          <p className="text-sm text-slate-500">
            Compare até 5 cenários lado a lado com projeções de RMI, idade e tempo de contribuição
          </p>
        </div>
      </div>

      {/* Scenario Inputs */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cenários ({scenarios.length}/5)
          </h2>
          <div className="flex items-center gap-2">
            {currentRmi !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={addBaseline}
                disabled={scenarios.some((s) => s.label === 'Cenário Atual')}
              >
                <TrendingUp className="mr-1.5 h-4 w-4" />
                Comparar com cenário atual
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddScenario}
              disabled={scenarios.length >= 5}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {scenarios.map((scenario, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300"
            >
              <div className="mb-3 flex items-center justify-between">
                <input
                  type="text"
                  value={scenario.label}
                  onChange={(e) => handleChange(idx, 'label', e.target.value)}
                  className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="Nome do cenário"
                />
                {scenarios.length > 2 && (
                  <button
                    onClick={() => handleRemoveScenario(idx)}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Remover cenário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <DatePicker
                    value={scenario.dib}
                    onChange={(val) => handleChange(idx, 'dib', val)}
                    label="DIB (Data Início do Benefício)"
                    hint="Data em que o benefício começará"
                  />
                </div>

                <div>
                  <CurrencyInput
                    value={scenario.valorContribuicaoFutura}
                    onChange={(val) => handleChange(idx, 'valorContribuicaoFutura', val)}
                    label="Valor Contribuição Futura"
                    hint="Valor mensal que será contribuído"
                  />
                </div>

                <div>
                  <ModalitySelect
                    benefitType={benefitType}
                    modalidades={allModalidades}
                    value={scenario.modalidade}
                    onChange={(val) => handleChange(idx, 'modalidade', val)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleCompare}
            disabled={loading}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Comparar Cenários
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {results && results.length > 0 && (
        <>
          {/* Chart */}
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Comparativo de RMI
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'RMI']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="RMI"
                    fill="#d97706"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                  {currentRmi !== null && (
                    <Bar
                      dataKey="RMI Atual"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Side-by-side Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Métrica
                    </th>
                    {results.map((r) => (
                      <th
                        key={r.label}
                        className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      RMI (Renda Mensal Inicial)
                    </td>
                    {results.map((r) => (
                      <td
                        key={r.label}
                        className="whitespace-nowrap px-4 py-3 text-center font-semibold text-amber-600"
                      >
                        {formatCurrency(r.rmi)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      RMA (Renda Mensal Atualizada)
                    </td>
                    {results.map((r) => (
                      <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600" key={r.label}>
                        {formatCurrency(r.rma)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      Ganho vs Situação Atual
                    </td>
                    {results.map((r) => (
                      <td
                        key={r.label}
                        className={`whitespace-nowrap px-4 py-3 text-center font-medium ${
                          r.gainVsNow > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {r.gainVsNow > 0 ? `+${formatCurrency(r.gainVsNow)}` : formatCurrency(r.gainVsNow)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      Idade na DIB
                    </td>
                    {results.map((r) => (
                      <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600" key={r.label}>
                        {r.idade} anos
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      Tempo de Contribuição
                    </td>
                    {results.map((r) => (
                      <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600" key={r.label}>
                        {r.tempoContribuicaoAnos} anos
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      Modalidade
                    </td>
                    {results.map((r) => (
                      <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600" key={r.label}>
                        {getModalityLabel(r.modalidade)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      Elegível
                    </td>
                    {results.map((r) => (
                      <td className="whitespace-nowrap px-4 py-3 text-center" key={r.label}>
                        {r.elegivel ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <XCircle className="h-4 w-4" />
                            Não
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
