'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/store/toast'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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
    setDeleteTarget(retroId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/cases/${params.id}/retroativos/${deleteTarget}`)
      addToast({ type: 'success', title: 'Retroativos excluídos' })
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o cálculo.' })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="font-sans font-medium text-slate-500 mt-4">Carregando painel de retroativos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Liquidação de Retroativos</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Calcule os valores atrasados devidos pelo INSS com correção monetária oficial.
          </p>
        </div>
        {retroativos.length > 0 && (
          <Button
            onClick={() => setShowModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nova Liquidação
          </Button>
        )}
      </div>

      {retroativos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
            <History className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhuma Liquidação de Retroativos</h3>
          <p className="font-sans text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Gere a memória de cálculo completa de parcelas atrasadas, corrigindo-as mês a mês pelo INPC oficial.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm"
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
                className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white hover:border-slate-300 transition-colors"
              >
                {/* Header do Card */}
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-slate-800 text-base sm:text-lg">
                      Parcelas Vencidas ({retro.mesesAtraso} meses)
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Período: {formatDate(retro.dataInicioDireito)} a {formatDate(retro.dataRequerimento)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedRetro(isExpanded ? null : retro.id)}
                      className="font-sans font-semibold text-xs text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
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
                      className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                      aria-label="Excluir este cálculo de retroativos"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Valor Mensal Original
                    </span>
                    <span className="font-sans font-bold text-slate-700 text-lg tracking-tight">
                      {formatCurrency(retro.valorMensalBruto)}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Total Bruto Original
                    </span>
                    <span className="font-sans font-bold text-slate-700 text-lg tracking-tight">
                      {formatCurrency(retro.valorTotalBruto)}
                    </span>
                  </div>

                  <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-xl p-4 flex flex-col justify-between">
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

                  <div className="bg-amber-50/30 border border-amber-200/50 rounded-xl p-4 flex flex-col justify-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-amber-700 block mb-1">
                      Valor Líquido a Receber
                    </span>
                    <span className="font-sans font-black text-amber-600 text-xl tracking-tight">
                      {formatCurrency(retro.valorLiquidoFinal)}
                    </span>
                  </div>
                </div>

                {/* Seção Expansível da Memória de Cálculo */}
                {isExpanded && retro.memoriaCalculo?.parcelas && (
                  <div className="p-6 border-t border-slate-200 bg-slate-50/20 space-y-4 animate-slide-down">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-slate-400" />
                      Memória de Cálculo Discriminada Mês a Mês
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                      <div className="flex items-start gap-2 bg-rose-50/40 border border-rose-100 rounded-xl p-4 text-xs font-sans text-rose-700">
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
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="font-sans text-sm font-medium text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <DatePicker
                  label="Data Início do Direito (DIB)"
                  value={dataInicioDireito}
                  onChange={(d) => setDataInicioDireito(d ? d.toISOString().split('T')[0] : '')}
                />
              </div>

              <div>
                <DatePicker
                  label="Data de Cálculo / Requerimento"
                  value={dataRequerimento}
                  onChange={(d) => setDataRequerimento(d ? d.toISOString().split('T')[0] : '')}
                />
              </div>
            </div>

            <div>
              <CurrencyInput
                value={valorMensalBruto ? parseFloat(valorMensalBruto) : ''}
                onChange={(val) => setValorMensalBruto(String(val))}
                label="Valor Mensal Devido (R$)"
                placeholder="Ex: 3.500,00"
                hint="O valor correspondente ao benefício mensal não recebido."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <CurrencyInput
                  value={valorDescontos ? parseFloat(valorDescontos) : ''}
                  onChange={(val) => setValorDescontos(String(val))}
                  label="Descontos Opcionais (R$)"
                  placeholder="Ex: 500,00"
                />
              </div>

              <div>
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Motivo/Descrição do Desconto</label>
                <input
                  type="text"
                  value={descricaoDescontos}
                  onChange={(e) => setDescricaoDescontos(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                  placeholder="Ex: Honorários já pagos"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
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

      {/* Modal de Confirmação de Exclusão */}
      <Modal open={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }} title="CONFIRMAR EXCLUSÃO">
        <div className="space-y-4">
          <p className="font-sans text-sm text-slate-600">
            Deseja realmente excluir este cálculo de retroativos? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Sim, Excluir
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
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
