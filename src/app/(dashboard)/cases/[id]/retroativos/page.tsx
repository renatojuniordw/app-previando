'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/store/toast'
import {
  History,
  Calendar,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  FileSpreadsheet,
  Plus
} from 'lucide-react'

interface ParcelaRetroativa {
  competencia: string
  valorOriginal: number
  indiceINPC: number
  valorCorrigido: number
  mesesAtraso: number
}

interface Retroativo {
  id: string
  dataInicioDireito: string
  dataRequerimento: string
  mesesAtraso: number
  valorMensalBruto: string | number
  valorTotalBruto: string | number
  valorTotalCorrigido: string | number
  indiceCorrecao: string
  valorDescontos: string | number
  descricaoDescontos?: string | null
  valorLiquidoFinal: string | number
  memoriaCalculo: {
    parcelas: ParcelaRetroativa[]
    acumuladoINPC: number
  }
  createdAt: string
}

const formatCurrency = (val: string | number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val))
}

const formatPercentage = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(val)
}

export default function RetroativosPage() {
  const params = useParams()
  const [retroativos, setRetroativos] = useState<Retroativo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Campos do Formulário
  const [dataInicioDireito, setDataInicioDireito] = useState('')
  const [dataRequerimento, setDataRequerimento] = useState(new Date().toISOString().split('T')[0])
  const [valorMensalBruto, setValorMensalBruto] = useState('')
  const [valorDescontos, setValorDescontos] = useState('0')
  const [descricaoDescontos, setDescricaoDescontos] = useState('')

  const { addToast } = useToast()
  const [expandedRetro, setExpandedRetro] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/cases/${params.id}/retroativos`)
      const mapped = (response.data.retroativos ?? []).map((r: {
        id: string
        entitlementStartDate: string
        requestDate: string
        monthsLate: number
        monthlyGrossValue: string | number
        totalGrossValue: string | number
        totalCorrectedValue: string | number
        correctionIndex: string
        discountValue: string | number
        discountDescription: string | null
        finalNetValue: string | number
        calculationMemory: {
          parcelas: ParcelaRetroativa[]
          acumuladoINPC: number
        }
        createdAt: string
      }) => ({
        id: r.id,
        dataInicioDireito: r.entitlementStartDate,
        dataRequerimento: r.requestDate,
        mesesAtraso: Number(r.monthsLate),
        valorMensalBruto: Number(r.monthlyGrossValue),
        valorTotalBruto: Number(r.totalGrossValue),
        valorTotalCorrigido: Number(r.totalCorrectedValue),
        indiceCorrecao: r.correctionIndex,
        valorDescontos: Number(r.discountValue),
        descricaoDescontos: r.discountDescription,
        valorLiquidoFinal: Number(r.finalNetValue),
        memoriaCalculo: r.calculationMemory,
        createdAt: r.createdAt
      }))
      setRetroativos(mapped)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    setErrorMessage('')

    if (!dataInicioDireito || !dataRequerimento || !valorMensalBruto) {
      setErrorMessage('Preencha os campos obrigatórios: Data de Início, Data de Fim/Requerimento e Valor Mensal.')
      return
    }

    const valorBrutoNum = parseFloat(valorMensalBruto.replace(',', '.'))
    const valorDescontosNum = parseFloat(valorDescontos.replace(',', '.'))

    if (isNaN(valorBrutoNum) || valorBrutoNum <= 0) {
      setErrorMessage('O valor mensal deve ser um número positivo.')
      return
    }

    if (new Date(dataInicioDireito) > new Date(dataRequerimento)) {
      setErrorMessage('A data de início do direito não pode ser posterior à data de requerimento/cálculo.')
      return
    }

    setCreating(true)
    try {
      await api.post(`/cases/${params.id}/retroativos`, {
        dataInicioDireito,
        dataRequerimento,
        valorMensalBruto: valorBrutoNum,
        valorDescontos: isNaN(valorDescontosNum) ? 0 : valorDescontosNum,
        descricaoDescontos: descricaoDescontos.trim() || undefined
      })

      setShowModal(false)
      // Reseta campos
      setDataInicioDireito('')
      setDataRequerimento(new Date().toISOString().split('T')[0])
      setValorMensalBruto('')
      setValorDescontos('0')
      setDescricaoDescontos('')
      addToast({ type: 'success', title: 'Retroativos calculados', message: 'Liquidação gerada com sucesso.' })
      load()
    } catch (err: unknown) {
      setErrorMessage((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Falha ao rodar o cálculo de retroativos.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (retroId: string) => {
    if (!confirm('Deseja realmente excluir este cálculo de retroativos?')) return
    try {
      await api.delete(`/cases/${params.id}/retroativos/${retroId}`)
      addToast({ type: 'success', title: 'Retroativos excluídos' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o cálculo.' })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center py-20">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        <p className="font-sans font-medium text-slate-500 mt-4">Carregando painel de retroativos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex align-items-center justify-content-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Liquidação de Retroativos</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Calcule os valores atrasados devidos pelo INSS com correção monetária oficial.
          </p>
        </div>
        {retroativos.length > 0 && (
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white flex align-items-center gap-2 shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nova Liquidação
          </Button>
        )}
      </div>

      {retroativos.length === 0 ? (
        <div className="py-20 flex flex-column align-items-center justify-content-center border border-dashed border-slate-300 bg-slate-50 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-white flex align-items-center justify-content-center mb-4 border border-slate-200 shadow-sm">
            <History className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhuma Liquidação de Retroativos</h3>
          <p className="font-sans text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Gere a memória de cálculo completa de parcelas atrasadas, corrigindo-as mês a mês pelo INPC oficial.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white flex align-items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Iniciar Liquidação
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {retroativos.map((retro) => {
            const isExpanded = expandedRetro === retro.id
            const ipcAcumulado = retro.memoriaCalculo?.acumuladoINPC ?? 0

            return (
              <div
                key={retro.id}
                className="border border-slate-200 rounded-xl neo-card-flat overflow-hidden bg-white hover:border-slate-300 transition-colors"
              >
                {/* Header do Card */}
                <div className="px-6 py-4 flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-slate-800 text-base sm:text-lg">
                      Parcelas Vencidas ({retro.mesesAtraso} meses)
                    </h3>
                    <div className="flex flex-wrap align-items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex align-items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Período: {formatDate(retro.dataInicioDireito)} a {formatDate(retro.dataRequerimento)}
                      </span>
                    </div>
                  </div>

                  <div className="flex align-items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedRetro(isExpanded ? null : retro.id)}
                      className="font-sans font-semibold text-xs text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors neo-btn flex align-items-center gap-1.5"
                    >
                      {isExpanded ? (
                        <>
                          Esconder Memória
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Ver Memória
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(retro.id)}
                      className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors neo-btn"
                      aria-label="Excluir este cálculo de retroativos"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-column justify-content-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Valor Mensal Original
                    </span>
                    <span className="font-sans font-bold text-slate-700 text-lg tracking-tight">
                      {formatCurrency(retro.valorMensalBruto)}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-column justify-content-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Total Bruto Original
                    </span>
                    <span className="font-sans font-bold text-slate-700 text-lg tracking-tight">
                      {formatCurrency(retro.valorTotalBruto)}
                    </span>
                  </div>

                  <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-xl p-4 flex flex-column justify-content-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-emerald-700 block mb-1">
                      Total Corrigido (INPC)
                    </span>
                    <span className="font-sans font-bold text-emerald-700 text-lg tracking-tight">
                      {formatCurrency(retro.valorTotalCorrigido)}
                      <span className="text-[10px] text-emerald-600 font-semibold ml-1.5 block sm:inline">
                        (+{formatPercentage(ipcAcumulado)})
                      </span>
                    </span>
                  </div>

                  <div className="bg-[var(--color-primary-tint)]/30 border border-[#F0B09A]/50 rounded-xl p-4 flex flex-column justify-content-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-[var(--color-primary-dark)] block mb-1">
                      Valor Líquido a Receber
                    </span>
                    <span className="font-sans font-black text-[var(--color-primary)] text-xl tracking-tight">
                      {formatCurrency(retro.valorLiquidoFinal)}
                    </span>
                  </div>
                </div>

                {/* Seção Expansível da Memória de Cálculo */}
                {isExpanded && retro.memoriaCalculo?.parcelas && (
                  <div className="p-6 border-t border-slate-150 bg-slate-50/20 space-y-4 animate-slide-down">
                    <div className="flex align-items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-slate-400" />
                      Memória de Cálculo Discriminada Mês a Mês
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden neo-card-flat">
                      <table className="w-full text-left font-sans text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                            <th className="px-4 py-3">Competência</th>
                            <th className="px-4 py-3">Valor Original</th>
                            <th className="px-4 py-3">Correção Acumulada</th>
                            <th className="px-4 py-3 text-right">Valor Corrigido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {retro.memoriaCalculo.parcelas.map((par, pIdx) => (
                            <tr key={pIdx} className="hover:bg-slate-50/55 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-800">{par.competencia}</td>
                              <td className="px-4 py-3 text-slate-500">{formatCurrency(par.valorOriginal)}</td>
                              <td className="px-4 py-3 text-slate-400">
                                {par.indiceINPC > 0 ? `+${formatPercentage(par.indiceINPC)}` : 'Sem correção'}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-800">
                                {formatCurrency(par.valorCorrigido)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {Number(retro.valorDescontos) > 0 && (
                      <div className="flex align-items-start gap-2 bg-rose-50/40 border border-rose-100 rounded-xl p-4 text-xs font-sans text-rose-700">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Descontos Aplicados na Liquidação</p>
                          <p className="mt-0.5 font-semibold text-rose-600">
                            Valor total descontado: {formatCurrency(retro.valorDescontos)}
                            {retro.descricaoDescontos && ` — Motivo: ${retro.descricaoDescontos}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Visual de Nova Liquidação de Retroativos */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="NOVA LIQUIDAÇÃO DE RETROATIVOS" size="lg">
        <div className="space-y-5">
          {errorMessage && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex align-items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="font-sans text-sm font-medium text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Data Início do Direito (DIB)</label>
                <input
                  type="date"
                  value={dataInicioDireito}
                  onChange={(e) => setDataInicioDireito(e.target.value)}
                  className="w-full bg-white rounded-md px-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-1 focus:ring-[var(--color-primary)]/30 neo-input-neo outline-none"
                />
              </div>

              <div>
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Data de Cálculo / Requerimento</label>
                <input
                  type="date"
                  value={dataRequerimento}
                  onChange={(e) => setDataRequerimento(e.target.value)}
                  className="w-full bg-white rounded-md px-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-1 focus:ring-[var(--color-primary)]/30 neo-input-neo outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Valor Mensal Devido (R$)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex align-items-center pointer-events-none text-slate-400 text-sm">
                  R$
                </div>
                <input
                  type="text"
                  value={valorMensalBruto}
                  onChange={(e) => setValorMensalBruto(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 outline-none"
                  placeholder="Ex: 3500,00"
                />
              </div>
              <span className="font-sans text-[10px] text-slate-400 mt-1 block">O valor correspondente ao benefício mensal não recebido.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Descontos Opcionais (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex align-items-center pointer-events-none text-slate-400 text-sm">
                    R$
                  </div>
                  <input
                    type="text"
                    value={valorDescontos}
                    onChange={(e) => setValorDescontos(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 outline-none"
                    placeholder="Ex: 500,00"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Motivo/Descrição do Desconto</label>
                <input
                  type="text"
                  value={descricaoDescontos}
                  onChange={(e) => setDescricaoDescontos(e.target.value)}
                  className="w-full bg-white rounded-md px-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-1 focus:ring-[var(--color-primary)]/30 neo-input-neo outline-none"
                  placeholder="Ex: Honorários já pagos"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold"
            >
              Liquidar Retroativos
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1 border-slate-300 text-slate-700 font-semibold"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
