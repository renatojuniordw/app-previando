'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calculator, Clock, CheckCircle2, XCircle, AlertCircle, Shield, Loader2 } from 'lucide-react'
import { IdentityVerification } from '@/components/portal/IdentityVerification'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PORTAL_BENEFIT_LABELS } from './portal-labels'

interface CalculationData {
  modality: string
  rmi: number
  rma: number
  benefitSalary: number
  eligible: boolean
  expectedDib: Date | null
  contributionTime: number | null
}

interface RetroactiveData {
  entitlementStartDate: Date
  requestDate: Date
  monthsLate: number
  totalGrossValue: number
  totalCorrectedValue: number
  finalNetValue: number
  correctionIndex: string
}

interface Props {
  token: string
  calculations: CalculationData[]
  retroactives: RetroactiveData[]
  requireIdentity: boolean
  /** Calculado no servidor (cookie de sessão do portal) — evita reabrir o formulário à toa. */
  initialVerified?: boolean
}

export function PortalContent({ token, calculations: initialCalc, retroactives: initialRetro, requireIdentity, initialVerified = false }: Props) {
  const [identityVerified, setIdentityVerified] = useState(initialVerified)
  const [calculations, setCalculations] = useState(initialCalc)
  const [retroactives, setRetroactives] = useState(initialRetro)
  const [fetching, setFetching] = useState(false)

  const fetchData = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch(`/api/portal/${token}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.calculations) setCalculations(data.calculations)
      if (data.retroactives) setRetroactives(data.retroactives)
    } catch {
      // silent — mantém dados iniciais
    } finally {
      setFetching(false)
    }
  }, [token])

  // Após verificar identidade no cliente, busca dados que o servidor não enviou
  useEffect(() => {
    if (requireIdentity && identityVerified && !initialVerified) {
      fetchData()
    }
  }, [identityVerified, requireIdentity, initialVerified, fetchData])

  const bestCalc = calculations[0]
  const needsVerification = requireIdentity && !identityVerified

  if (needsVerification) {
    return (
      <IdentityVerification
        token={token}
        onVerified={() => setIdentityVerified(true)}
      />
    )
  }

  const showContent = !requireIdentity || identityVerified

  return (
    <>
      {fetching && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="font-sans text-sm">Carregando dados do caso...</p>
        </div>
      )}

      {/* Cálculos selecionados */}
      {showContent && calculations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calculator className="w-4 h-4" aria-hidden="true" />
            <span className="font-sans text-sm font-medium uppercase tracking-wide">
              Cálculos do Benefício
            </span>
          </div>

          {bestCalc && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                {bestCalc.eligible ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />
                )}
                <span className="font-sans text-sm font-semibold text-slate-800">
                  {PORTAL_BENEFIT_LABELS[bestCalc.modality] ?? bestCalc.modality}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="font-sans text-xs text-slate-500">
                    {bestCalc.modality === 'BPC_LOAS' ? 'Valor do Benefício' : 'RMI'}
                  </p>
                  <p className="font-sans font-bold text-xl text-amber-700">
                    {formatCurrency(bestCalc.rmi)}
                  </p>
                </div>
                {bestCalc.modality !== 'BPC_LOAS' && (
                  <div>
                    <p className="font-sans text-xs text-slate-500">RMA</p>
                    <p className="font-sans font-semibold text-slate-800">
                      {formatCurrency(bestCalc.rma)}
                    </p>
                  </div>
                )}
                {bestCalc.expectedDib && (
                  <div>
                    <p className="font-sans text-xs text-slate-500">DIB Estimada</p>
                    <p className="font-sans font-semibold text-slate-800">
                      {formatDate(bestCalc.expectedDib)}
                    </p>
                  </div>
                )}
                {bestCalc.contributionTime != null && (
                  <div>
                    <p className="font-sans text-xs text-slate-500">Tempo de Contribuição</p>
                    <p className="font-sans font-semibold text-slate-800">
                      {bestCalc.contributionTime} meses
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {calculations.length > 1 && (
            <div className="space-y-2">
              {calculations.slice(1).map((calc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    {calc.eligible ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className="font-sans text-sm text-slate-700">
                      {PORTAL_BENEFIT_LABELS[calc.modality] ?? calc.modality}
                    </span>
                  </div>
                  <span className="font-sans text-sm font-semibold text-slate-800">
                    {formatCurrency(calc.rmi)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Retroativos */}
      {showContent && retroactives.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span className="font-sans text-sm font-medium uppercase tracking-wide">
              Valores Retroativos
            </span>
          </div>
          {retroactives.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-sans text-xs text-slate-400">Competência Inicial</p>
                <p className="font-sans font-semibold text-slate-900">
                  {formatDate(r.entitlementStartDate)}
                </p>
              </div>
              <div>
                <p className="font-sans text-xs text-slate-400">Meses de Atraso</p>
                <p className="font-sans font-semibold text-slate-900">{r.monthsLate} meses</p>
              </div>
              <div>
                <p className="font-sans text-xs text-slate-400">Total Bruto</p>
                <p className="font-sans font-semibold text-slate-900">
                  {formatCurrency(r.totalGrossValue)}
                </p>
              </div>
              <div>
                <p className="font-sans text-xs text-slate-400">Total Corrigido ({r.correctionIndex})</p>
                <p className="font-sans font-semibold text-slate-900">
                  {formatCurrency(r.totalCorrectedValue)}
                </p>
              </div>
              <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-sans text-xs text-green-600 font-medium">Valor Líquido Final</p>
                <p className="font-sans font-bold text-xl text-green-700">
                  {formatCurrency(r.finalNetValue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio quando não há dados */}
      {!fetching && calculations.length === 0 && retroactives.length === 0 && identityVerified && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-sans font-semibold text-slate-700">Identidade verificada</p>
          <p className="text-xs text-slate-400 mt-1">
            Em breve seu advogado disponibilizará os dados do seu caso aqui.
          </p>
        </div>
      )}
    </>
  )
}
