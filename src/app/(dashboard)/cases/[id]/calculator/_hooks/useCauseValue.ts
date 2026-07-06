'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'

interface CauseValueMemory {
  retroativo: {
    parcelas: Array<{
      competencia: string
      valorOriginal: number
      indiceINPC: number
      valorCorrigido: number
      mesesAtraso: number
    }>
    acumuladoINPC: number
  }
  salarioMinimoUtilizado: number
}

interface CauseValueCalculation {
  id: string
  administrativeRequestDate: string
  lawsuitFilingDate: string
  entitlementStartDate: string
  monthlyGrossValue: string | number
  monthsLate: number
  totalCorrectedValue: string | number
  correctionIndex: string
  futureInstallmentsCount: number
  futureInstallmentsValue: string | number
  futureInstallmentsTotal: string | number
  totalCauseValue: string | number
  calculationMemory: CauseValueMemory
  createdAt: string
}

export function useCauseValue() {
  const params = useParams()
  const { addToast } = useToast()

  const [causeValueCalculations, setCauseValueCalculations] = useState<CauseValueCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [dataRequerimentoAdministrativo, setDataRequerimentoAdministrativo] = useState('')
  const [dataAjuizamento, setDataAjuizamento] = useState(new Date().toISOString().split('T')[0])
  const [dataInicioDireito, setDataInicioDireito] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/cases/${params.id}/causa`)
      setCauseValueCalculations(response.data.causeValueCalculations ?? [])
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar o valor da causa.' })
    } finally {
      setLoading(false)
    }
  }, [params.id, addToast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    setErrorMessage('')

    if (!dataRequerimentoAdministrativo || !dataAjuizamento || !dataInicioDireito) {
      setErrorMessage('Preencha a data do requerimento administrativo, do ajuizamento e a DIB.')
      return
    }

    if (new Date(dataRequerimentoAdministrativo) > new Date(dataAjuizamento)) {
      setErrorMessage('A data do requerimento administrativo não pode ser posterior à data de ajuizamento.')
      return
    }

    setCreating(true)
    try {
      await api.post(`/cases/${params.id}/causa`, {
        dataRequerimentoAdministrativo,
        dataAjuizamento,
        dataInicioDireito,
      })

      setShowModal(false)
      addToast({ type: 'success', title: 'Valor da causa calculado', message: 'O valor foi calculado com sucesso.' })
      load()
    } catch (err: unknown) {
      setErrorMessage((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Falha ao calcular o valor da causa.')
    } finally {
      setCreating(false)
    }
  }

  return {
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
  }
}
