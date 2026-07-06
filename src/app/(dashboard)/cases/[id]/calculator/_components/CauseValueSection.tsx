'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useCauseValue } from '../_hooks/useCauseValue'
import { Gavel, ShieldAlert, Calendar } from 'lucide-react'

export function CauseValueSection() {
  const {
    causeValueCalculations,
    loading,
    creating,
    showModal,
    setShowModal,
    errorMessage,
    dataRequerimentoAdministrativo,
    setDataRequerimentoAdministrativo,
    dataAjuizamento,
    setDataAjuizamento,
    dataInicioDireito,
    setDataInicioDireito,
    handleCreate,
  } = useCauseValue()

  const latest = causeValueCalculations[0]

  if (loading) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
            <Gavel className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold tracking-tight text-slate-900">
              Valor da Causa
            </h2>
            <p className="font-sans text-xs text-slate-500">
              Parcelas vencidas corrigidas (INPC) + 12 parcelas vincendas no salário mínimo vigente.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          <Gavel className="h-4 w-4" />
          Calcular Valor da Causa
        </Button>
      </div>

      {latest && (
        <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-1 p-5">
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Parcelas Vencidas Corrigidas
            </span>
            <span className="font-mono text-lg font-bold text-slate-900">
              {formatCurrency(latest.totalCorrectedValue)}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-5">
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              12 Parcelas Vincendas
            </span>
            <span className="font-mono text-lg font-bold text-slate-900">
              {formatCurrency(latest.futureInstallmentsTotal)}
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-amber-50/30 p-5">
            <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Valor da Causa
            </span>
            <span className="font-mono text-lg font-bold text-amber-700">
              {formatCurrency(latest.totalCauseValue)}
            </span>
          </div>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Calcular Valor da Causa"
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
            <DatePicker
              label="Data do requerimento administrativo"
              value={dataRequerimentoAdministrativo}
              onChange={(d) => setDataRequerimentoAdministrativo(d ? d.toISOString().split('T')[0] : '')}
            />
            <DatePicker
              label="Data de início do benefício (DIB)"
              value={dataInicioDireito}
              onChange={(d) => setDataInicioDireito(d ? d.toISOString().split('T')[0] : '')}
            />
            <DatePicker
              label="Data do ajuizamento da ação"
              value={dataAjuizamento}
              onChange={(d) => setDataAjuizamento(d ? d.toISOString().split('T')[0] : '')}
            />
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-amber-600 font-semibold text-white hover:bg-amber-700"
            >
              Calcular
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

      {causeValueCalculations.length > 0 && (
        <div className="flex items-center gap-1.5 border-t border-slate-100 px-6 py-3 text-slate-400">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider">
            Último cálculo em {formatDate(latest.createdAt)}
          </span>
        </div>
      )}
    </div>
  )
}
