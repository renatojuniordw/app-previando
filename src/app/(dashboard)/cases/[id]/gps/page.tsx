'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Receipt, Calculator, AlertCircle, CheckCircle2,
  History, Trash2, Loader2, Percent, Banknote, Hash,
} from 'lucide-react'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { MonthPicker } from '@/components/ui/MonthPicker'
import { cn, formatCurrency } from '@/lib/utils'
import type { CategoriaContribuinte, PlanoContribuicao, GpsResult } from '@/lib/gps-engine'

interface CategoriaInfo {
  categoria: CategoriaContribuinte
  label: string
  descricao: string
}

interface GuiaHistory {
  id: string
  categoria: string
  plano: string
  salarioContribuicao: number
  valorCalculado: number
  aliquota: number
  codigoPagamento: string
  competencia: string
  createdAt: string
}

const PLANO_LABELS: Record<PlanoContribuicao, string> = {
  NORMAL: 'Plano Normal',
  SIMPLIFICADO: 'Plano Simplificado',
  BAIXA_RENDA: 'Baixa Renda',
}

const CATEGORIA_LABELS: Record<string, string> = {
  CI: 'Contribuinte Individual',
  FACULTATIVO: 'Facultativo',
  MEI: 'MEI',
  SEGURADO_ESPECIAL: 'Segurado Especial',
}

export default function GpsPage() {
  const params = useParams()
  const caseId = params.id as string

  const [categorias, setCategorias] = useState<CategoriaInfo[]>([])
  const [history, setHistory] = useState<GuiaHistory[]>([])
  const [selectedCat, setSelectedCat] = useState<CategoriaContribuinte | ''>('')
  const [selectedPlano, setSelectedPlano] = useState<PlanoContribuicao>('NORMAL')
  const [salario, setSalario] = useState('')
  const [competencia, setCompetencia] = useState('')
  const [result, setResult] = useState<GpsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadHistory = async () => {
    try {
      const r = await api.get(`/cases/${caseId}/gps`)
      setHistory(r.data.guias || [])
      return r.data
    } catch {
      return null
    }
  }

  useEffect(() => {
    api.get(`/cases/${caseId}/gps`)
      .then((r) => {
        setCategorias(r.data.categorias || [])
        setHistory(r.data.guias || [])
      })
      .catch(() => null)
      .finally(() => setLoadingInit(false))
  }, [caseId])

  const handleSubmit = async () => {
    setError('')
    setSuccessMsg('')
    setResult(null)

    if (!selectedCat || !salario || !competencia) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    const valor = Number(salario)
    if (valor <= 0 || isNaN(valor)) {
      setError('Salário de contribuição deve ser um valor positivo.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post(`/cases/${caseId}/gps`, {
        categoria: selectedCat,
        plano: selectedPlano,
        salarioContribuicao: valor,
        competencia,
      })
      setResult(res.data)
      setSalario('')
      setCompetencia('')
      setSuccessMsg('Guia calculada e salva com sucesso.')
      await loadHistory()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao calcular contribuição.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (guiaId: string) => setDeleteTarget(guiaId)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)
    setDeletingId(id)
    try {
      await api.delete(`/cases/${caseId}/gps/${id}`)
      setHistory((prev) => prev.filter((g) => g.id !== id))
      if (result && (result as GpsResult & { id?: string }).id === id) setResult(null)
    } catch {
      setError('Erro ao excluir guia.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loadingInit) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-0">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            Guias de Contribuição (GPS/DAS)
          </h1>
          <p className="mt-1 font-sans text-sm text-slate-500">
            Calcule contribuições previdenciárias para Contribuinte Individual, Facultativo, MEI e Segurado Especial.
          </p>
        </div>
      </div>

      {/* Help Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3.5">
        <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="font-sans text-xs font-semibold leading-relaxed text-amber-900">
          Selecione a categoria do contribuinte e o plano desejado. O histórico de guias geradas fica salvo no caso para consulta futura.
        </p>
      </div>

      {/* Form Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Calculator className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
          </div>
          <h2 className="font-sans text-sm font-extrabold uppercase tracking-wider text-slate-600">
            Calcular Contribuição
          </h2>
        </div>

        <div className="space-y-6 p-6">
          {/* Categoria */}
          <div>
            <label className="neo-label mb-3 block">Categoria do Contribuinte</label>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {categorias.map((cat) => (
                <button
                  key={cat.categoria}
                  onClick={() => { setSelectedCat(cat.categoria); setResult(null); setSuccessMsg('') }}
                  className={cn(
                    'rounded-xl border-2 p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    selectedCat === cat.categoria
                      ? 'border-amber-400 bg-amber-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                  aria-pressed={selectedCat === cat.categoria}
                >
                  <span className="block font-sans text-sm font-bold text-slate-900">{cat.label}</span>
                  <span className="mt-0.5 block font-sans text-[10px] leading-relaxed text-slate-500">
                    {cat.descricao}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Plano */}
          {selectedCat && selectedCat !== 'MEI' && selectedCat !== 'SEGURADO_ESPECIAL' && (
            <div className="animate-fade-in">
              <label className="neo-label mb-2 block">Plano de Contribuição</label>
              <div className="flex flex-wrap gap-2">
                {(['NORMAL', 'SIMPLIFICADO', 'BAIXA_RENDA'] as PlanoContribuicao[]).map((plano) => (
                  <button
                    key={plano}
                    onClick={() => setSelectedPlano(plano)}
                    className={cn(
                      'rounded-lg border-2 px-4 py-2 font-sans text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                      selectedPlano === plano
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                    aria-pressed={selectedPlano === plano}
                  >
                    {PLANO_LABELS[plano]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CurrencyInput
              value={salario ? parseFloat(salario) : ''}
              onChange={(val) => setSalario(String(val))}
              label={selectedCat === 'MEI' ? 'Salário de Contribuição (fixo = SM)' : 'Salário de Contribuição (R$)'}
              disabled={selectedCat === 'MEI'}
              placeholder="Ex: 1.518,00"
            />
            <div>
              <label className="neo-label mb-1 block">Competência</label>
              <MonthPicker value={competencia} onChange={setCompetencia} />
            </div>
          </div>

          {/* Error / Success alerts */}
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              <span className="font-sans text-sm text-red-700">{error}</span>
            </div>
          )}
          {successMsg && (
            <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <span className="font-sans text-sm font-semibold text-emerald-700">{successMsg}</span>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedCat}
            loading={loading}
            className="flex items-center gap-2 bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
          >
            <Calculator className="h-4 w-4" />
            {loading ? 'Calculando...' : 'Calcular e Salvar Guia'}
          </Button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-sm">
          {/* Emerald stripe = success */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />

          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-sm font-extrabold uppercase tracking-wider text-slate-600">
                Resultado do Cálculo
              </h2>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-extrabold text-emerald-700">
              {result.competencia}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-0 border-b border-slate-100 md:grid-cols-4">
            <ResultCell label="Salário de Contribuição" icon={<Banknote className="h-4 w-4 text-slate-400" />} border="right">
              <span className="font-mono text-lg font-bold text-slate-900">
                R$ {result.salarioContribuicao.toFixed(2)}
              </span>
            </ResultCell>
            <ResultCell label="Alíquota" icon={<Percent className="h-4 w-4 text-amber-500" />} highlight="amber" border="right">
              <span className="font-mono text-lg font-bold text-amber-700">
                {(result.aliquota * 100).toFixed(1)}%
              </span>
            </ResultCell>
            <ResultCell label="Valor a Recolher" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} highlight="emerald" border="right">
              <span className="font-mono text-lg font-bold text-emerald-700">
                R$ {result.valorCalculado.toFixed(2)}
              </span>
            </ResultCell>
            <ResultCell label="Código GPS" icon={<Hash className="h-4 w-4 text-slate-400" />}>
              <span className="font-mono text-lg font-bold text-slate-800">
                {result.codigoPagamento}
              </span>
            </ResultCell>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <p className="font-sans text-sm leading-relaxed text-slate-600">
              {result.descricao}
            </p>
            <button
              onClick={() => { setResult(null); setSuccessMsg('') }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 font-sans text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Nova guia
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <History className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-sm font-extrabold uppercase tracking-wider text-slate-600">
                Guias Geradas
              </h2>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-sans text-[10px] font-extrabold text-slate-500">
              {history.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {history.map((g) => (
              <div
                key={g.id}
                className="flex flex-col items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-sm">
                  <span className="font-bold text-slate-800">{CATEGORIA_LABELS[g.categoria] ?? g.categoria}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="font-mono text-slate-600">{g.competencia}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                    Cód. {g.codigoPagamento}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {formatCurrency(g.valorCalculado)}
                  </span>
                  <span className="font-sans text-xs text-slate-400">
                    {new Date(g.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    onClick={() => handleDelete(g.id)}
                    disabled={deletingId === g.id}
                    className="rounded-lg border border-red-200 p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-40"
                    aria-label={`Excluir guia ${g.categoria} — ${g.competencia}`}
                  >
                    {deletingId === g.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        title="Excluir guia?"
        message="Tem certeza que deseja excluir esta guia? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ResultCell({
  label,
  icon,
  highlight,
  border,
  children,
}: {
  label: string
  icon: React.ReactNode
  highlight?: 'amber' | 'emerald'
  border?: 'right'
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      'flex flex-col gap-1 p-5',
      highlight === 'amber' && 'bg-amber-50/30',
      highlight === 'emerald' && 'bg-emerald-50/30',
      border === 'right' && 'border-b border-slate-100 sm:border-b-0 sm:border-r'
    )}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}
