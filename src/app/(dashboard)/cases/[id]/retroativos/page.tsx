'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatDate, formatCurrency, formatPercentage, cn } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useRetroativos } from './_hooks/useRetroativos'
import {
  History,
  Calendar,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  FileSpreadsheet,
  Plus,
  TrendingUp,
  Banknote,
  Receipt,
  PercentCircle,
} from 'lucide-react'

export default function RetroativosPage() {
  const {
    retroativos,
    loading,
    creating,
    showModal,
    setShowModal,
    errorMessage,
    dataInicioDireito,
    setDataInicioDireito,
    dataRequerimento,
    setDataRequerimento,
    valorMensalBruto,
    setValorMensalBruto,
    valorDescontos,
    setValorDescontos,
    descricaoDescontos,
    setDescricaoDescontos,
    percentualHonorarios,
    setPercentualHonorarios,
    showDeleteConfirm,
    setShowDeleteConfirm,
    setDeleteTarget,
    handleCreate,
    handleDelete,
    confirmDelete,
  } = useRetroativos()

  const [expandedRetro, setExpandedRetro] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="mt-4 animate-pulse font-sans text-sm font-medium text-slate-500">
          Carregando painel de retroativos...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            Liquidação de Retroativos
          </h1>
          <p className="mt-1 font-sans text-sm text-slate-500">
            Calcule valores atrasados devidos pelo INSS com correção monetária oficial (INPC mês a mês).
          </p>
        </div>
        {retroativos.length > 0 && (
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Nova Liquidação
          </Button>
        )}
      </div>

      {/* Help Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3.5">
        <History className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="font-sans text-xs font-semibold leading-relaxed text-amber-900">
          Gere a memória de cálculo completa de parcelas atrasadas, corrigindo-as mês a mês pelo INPC oficial. O valor líquido final já considera os descontos informados.
        </p>
      </div>

      {/* Empty State */}
      {retroativos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-250 bg-white py-20 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 shadow-xs">
            <History className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mb-2 font-serif text-lg font-bold text-slate-900">
            Nenhuma Liquidação de Retroativos
          </h2>
          <p className="mx-auto mb-7 max-w-sm font-sans text-sm leading-relaxed text-slate-500">
            Gere a memória de cálculo completa de parcelas atrasadas, corrigindo-as mês a mês pelo INPC oficial.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-600 text-white shadow-sm hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Iniciar Liquidação
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {retroativos.map((retro) => {
            const isExpanded = expandedRetro === retro.id
            const ipcAcumulado = retro.memoriaCalculo?.acumuladoINPC ?? 0

            return (
              <div
                key={retro.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
              >
                {/* Top gradient accent */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                {/* Card Header */}
                <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
                  <div className="space-y-1.5">
                    <h2 className="font-serif text-lg font-bold tracking-tight text-slate-900">
                      Parcelas Vencidas —{' '}
                      <span className="font-mono text-base text-amber-700">
                        {retro.mesesAtraso} meses
                      </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        Período:{' '}
                        <span className="font-mono">
                          {formatDate(retro.dataInicioDireito)} → {formatDate(retro.dataRequerimento)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedRetro(isExpanded ? null : retro.id)}
                      aria-expanded={isExpanded}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="h-3.5 w-3.5" /> Esconder Memória</>
                      ) : (
                        <><ChevronDown className="h-3.5 w-3.5" /> Ver Memória</>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(retro.id)}
                      className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      aria-label="Excluir este cálculo de retroativos"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* KPI Strip — 4 metrics */}
                <div className="grid grid-cols-2 gap-0 border-t border-slate-100 sm:grid-cols-4">
                  <KpiCell
                    label="Valor Mensal Original"
                    icon={<Banknote className="h-4 w-4 text-slate-400" />}
                    border="right"
                  >
                    <span className="font-mono text-lg font-bold text-slate-700">
                      {formatCurrency(retro.valorMensalBruto)}
                    </span>
                  </KpiCell>

                  <KpiCell
                    label="Total Bruto Acumulado"
                    icon={<Receipt className="h-4 w-4 text-slate-400" />}
                    border="right"
                  >
                    <span className="font-mono text-lg font-bold text-slate-700">
                      {formatCurrency(retro.valorTotalBruto)}
                    </span>
                  </KpiCell>

                  <KpiCell
                    label="Total Corrigido (INPC)"
                    icon={<PercentCircle className="h-4 w-4 text-emerald-500" />}
                    highlight="emerald"
                    border="right"
                  >
                    <span className="font-mono text-lg font-bold text-emerald-700">
                      {formatCurrency(retro.valorTotalCorrigido)}
                    </span>
                    <span className="mt-0.5 block font-sans text-[10px] font-bold text-emerald-600">
                      +{formatPercentage(ipcAcumulado * 100)} acumulado
                    </span>
                  </KpiCell>

                  <KpiCell
                    label="Valor Líquido a Receber"
                    icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
                    highlight="amber"
                  >
                    <span className="font-mono text-xl font-black text-amber-600">
                      {formatCurrency(retro.valorLiquidoFinal)}
                    </span>
                  </KpiCell>
                </div>

                {/* Split Honorários vs Cliente */}
                {retro.percentualHonorarios != null && (
                  <div className="grid grid-cols-2 gap-0 border-t border-slate-100">
                    <KpiCell
                      label={`Honorários Advocatícios (${formatPercentage(Number(retro.percentualHonorarios))})`}
                      icon={<PercentCircle className="h-4 w-4 text-indigo-500" />}
                      highlight="indigo"
                      border="right"
                    >
                      <span className="font-mono text-lg font-bold text-indigo-700">
                        {formatCurrency(retro.valorHonorarios ?? 0)}
                      </span>
                    </KpiCell>

                    <KpiCell
                      label="Valor Líquido do Cliente"
                      icon={<Banknote className="h-4 w-4 text-emerald-500" />}
                      highlight="emerald"
                    >
                      <span className="font-mono text-lg font-bold text-emerald-700">
                        {formatCurrency(retro.valorLiquidoCliente ?? 0)}
                      </span>
                    </KpiCell>
                  </div>
                )}

                {/* Expanded: Calculation Memory */}
                {isExpanded && retro.memoriaCalculo?.parcelas && (
                  <div className="animate-fade-in space-y-4 border-t border-slate-100 bg-slate-50/30 p-6">

                    {/* Section label */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      </div>
                      <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Memória de Cálculo — Discriminada Mês a Mês
                      </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left font-sans text-xs" role="table">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th scope="col" className="px-4 py-3 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Competência
                            </th>
                            <th scope="col" className="px-4 py-3 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Valor Original
                            </th>
                            <th scope="col" className="px-4 py-3 font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Correção (INPC)
                            </th>
                            <th scope="col" className="px-4 py-3 text-right font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Valor Corrigido
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {retro.memoriaCalculo.parcelas.map((par, pIdx) => (
                            <tr key={pIdx} className="transition-colors hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                {par.competencia}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-500">
                                {formatCurrency(par.valorOriginal)}
                              </td>
                              <td className="px-4 py-3">
                                {par.indiceINPC > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                                    +{formatPercentage(par.indiceINPC * 100)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Sem correção</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                                {formatCurrency(par.valorCorrigido)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Desconto Alert */}
                    {Number(retro.valorDescontos) > 0 && (
                      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600">
                          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <div className="font-sans text-xs">
                          <p className="font-bold text-rose-800">Descontos Aplicados na Liquidação</p>
                          <p className="mt-0.5 font-semibold text-rose-700">
                            Total descontado: <span className="font-mono">{formatCurrency(retro.valorDescontos)}</span>
                            {retro.descricaoDescontos && (
                              <span className="text-rose-600"> — {retro.descricaoDescontos}</span>
                            )}
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

      {/* Modal — Nova Liquidação */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Liquidação de Retroativos"
        size="lg"
      >
        <div className="space-y-5">
          {errorMessage && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
              <p className="font-sans text-sm font-medium text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                label="Data Início do Direito (DIB)"
                value={dataInicioDireito}
                onChange={(d) => setDataInicioDireito(d ? d.toISOString().split('T')[0] : '')}
              />
              <DatePicker
                label="Data de Cálculo / Requerimento"
                value={dataRequerimento}
                onChange={(d) => setDataRequerimento(d ? d.toISOString().split('T')[0] : '')}
              />
            </div>

            <CurrencyInput
              value={valorMensalBruto ? parseFloat(valorMensalBruto) : ''}
              onChange={(val) => setValorMensalBruto(String(val))}
              label="Valor Mensal Devido (R$)"
              placeholder="Ex: 3.500,00"
              hint="Valor correspondente ao benefício mensal não recebido pelo segurado."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CurrencyInput
                value={valorDescontos ? parseFloat(valorDescontos) : ''}
                onChange={(val) => setValorDescontos(String(val))}
                label="Descontos Opcionais (R$)"
                placeholder="Ex: 500,00"
              />
              <div>
                <label htmlFor="descricao-desconto" className="neo-label">
                  Motivo / Descrição do Desconto
                </label>
                <input
                  id="descricao-desconto"
                  type="text"
                  value={descricaoDescontos}
                  onChange={(e) => setDescricaoDescontos(e.target.value)}
                  className="neo-input"
                  placeholder="Ex: Honorários já pagos"
                />
              </div>
            </div>

            <div>
              <label htmlFor="percentual-honorarios" className="neo-label">
                Percentual de Honorários Advocatícios (%)
              </label>
              <input
                id="percentual-honorarios"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={percentualHonorarios}
                onChange={(e) => setPercentualHonorarios(e.target.value)}
                className="neo-input"
                placeholder="Ex: 20"
              />
              <p className="mt-1 font-sans text-xs text-slate-400">
                Opcional. Se informado, divide o valor líquido final entre honorários e cliente, e cria automaticamente um honorário vinculado.
              </p>
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-amber-600 font-semibold text-white hover:bg-amber-700"
            >
              Liquidar Retroativos
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog — Exclusão */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
        title="Excluir liquidação?"
        message="Deseja realmente excluir este cálculo de retroativos? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCell({
  label,
  icon,
  highlight,
  border,
  children,
}: {
  label: string
  icon: React.ReactNode
  highlight?: 'amber' | 'emerald' | 'indigo'
  border?: 'right'
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      'flex flex-col gap-1 p-5',
      highlight === 'amber' && 'bg-amber-50/20',
      highlight === 'emerald' && 'bg-emerald-50/20',
      highlight === 'indigo' && 'bg-indigo-50/20',
      border === 'right' && 'border-b border-slate-100 sm:border-b-0 sm:border-r'
    )}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="mt-0.5 flex flex-col">{children}</div>
    </div>
  )
}
