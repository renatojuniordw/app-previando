'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Receipt, Calculator, AlertCircle, CheckCircle, History, Trash2 } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { MonthPicker } from '@/components/ui/MonthPicker'
import { HelpText } from '@/components/ui/HelpText'
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
    const r = await api.get(`/cases/${caseId}/gps`)
    setHistory(r.data.guias || [])
    return r.data
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
      setError('Preencha todos os campos.')
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
      setCompetencia('')
      setSuccessMsg('Guia salva com sucesso!')
      await loadHistory()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao calcular contribuição.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (guiaId: string) => {
    setDeleteTarget(guiaId)
  }

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
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-amber-600" />
          Guias de Contribuição (GPS/DAS)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Calcule contribuições previdenciárias para Contribuinte Individual, Facultativo, MEI e Segurado Especial.
        </p>
      </div>

      <HelpText title="Sobre guias GPS/DAS" variant="info" collapsible>
        <p>Calcule o valor da contribuição previdenciária e gere guias GPS/DAS para recolhimento.
        Selecione a categoria do contribuinte e o plano desejado. O histórico de guias geradas fica
        salvo no caso para consulta futura.</p>
      </HelpText>

      {/* Formulário */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-600" />
          Calcular Contribuição
        </h3>

        {/* Categoria */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.categoria}
                onClick={() => { setSelectedCat(cat.categoria); setResult(null); setSuccessMsg('') }}
                className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                  selectedCat === cat.categoria
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-medium text-slate-900 block">{cat.label}</span>
                <span className="text-xs text-slate-500 mt-0.5 block">{cat.descricao}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Plano */}
        {selectedCat && selectedCat !== 'MEI' && selectedCat !== 'SEGURADO_ESPECIAL' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Plano</label>
            <div className="flex gap-2">
              {(['NORMAL', 'SIMPLIFICADO', 'BAIXA_RENDA'] as PlanoContribuicao[]).map((plano) => (
                <button
                  key={plano}
                  onClick={() => setSelectedPlano(plano)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                    selectedPlano === plano
                      ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {PLANO_LABELS[plano]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <CurrencyInput
              value={salario ? parseFloat(salario) : ''}
              onChange={(val) => setSalario(String(val))}
              label={selectedCat === 'MEI' ? 'Salário de Contribuição (fixo = SM)' : 'Salário de Contribuição (R$)'}
              disabled={selectedCat === 'MEI'}
              placeholder="Ex: 1.518,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Competência</label>
            <MonthPicker value={competencia} onChange={setCompetencia} />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-green-700">{successMsg}</span>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={loading || !selectedCat} className="w-full md:w-auto">
          {loading ? 'Salvando...' : 'Calcular e Salvar'}
        </Button>
      </Card>

      {/* Resultado */}
      {result && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Resultado
            </h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              {result.competencia}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block mb-1">Salário Contribuição</span>
              <span className="text-lg font-bold text-slate-900">R$ {result.salarioContribuicao.toFixed(2)}</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <span className="text-xs text-amber-600 block mb-1">Alíquota</span>
              <span className="text-lg font-bold text-amber-700">{(result.aliquota * 100).toFixed(1)}%</span>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <span className="text-xs text-green-600 block mb-1">Valor a Recolher</span>
              <span className="text-lg font-bold text-green-700">R$ {result.valorCalculado.toFixed(2)}</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-600 block mb-1">Código GPS</span>
              <span className="text-lg font-bold text-blue-700">{result.codigoPagamento}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{result.descricao}</p>
        </Card>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Guias Geradas ({history.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {history.map((g) => (
              <div key={g.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-800">{g.categoria}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500">{g.competencia}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500">Cód. {g.codigoPagamento}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-800">R$ {g.valorCalculado.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">{new Date(g.createdAt).toLocaleDateString('pt-BR')}</span>
                  <button
                    onClick={() => handleDelete(g.id)}
                    disabled={deletingId === g.id}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Excluir guia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
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
