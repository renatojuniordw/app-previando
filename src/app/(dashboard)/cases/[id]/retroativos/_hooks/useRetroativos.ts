'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'

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
  percentualHonorarios?: string | number | null
  valorHonorarios?: string | number | null
  valorLiquidoCliente?: string | number | null
  memoriaCalculo: {
    parcelas: ParcelaRetroativa[]
    acumuladoINPC: number
  }
  createdAt: string
}

export function useRetroativos() {
  const params = useParams()
  const { addToast } = useToast()

  const [retroativos, setRetroativos] = useState<Retroativo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [dataInicioDireito, setDataInicioDireito] = useState('')
  const [dataRequerimento, setDataRequerimento] = useState(new Date().toISOString().split('T')[0])
  const [valorMensalBruto, setValorMensalBruto] = useState('')
  const [valorDescontos, setValorDescontos] = useState('0')
  const [descricaoDescontos, setDescricaoDescontos] = useState('')
  const [percentualHonorarios, setPercentualHonorarios] = useState('')

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
        feePercentage?: string | number | null
        feeValue?: string | number | null
        clientNetValue?: string | number | null
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
        percentualHonorarios: r.feePercentage != null ? Number(r.feePercentage) : null,
        valorHonorarios: r.feeValue != null ? Number(r.feeValue) : null,
        valorLiquidoCliente: r.clientNetValue != null ? Number(r.clientNetValue) : null,
        memoriaCalculo: r.calculationMemory,
        createdAt: r.createdAt
      }))
      setRetroativos(mapped)
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar retroativo.' })
    } finally {
      setLoading(false)
    }
  }, [params.id, addToast])

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
    const percentualHonorariosNum = percentualHonorarios.trim() === '' ? undefined : parseFloat(percentualHonorarios.replace(',', '.'))

    if (isNaN(valorBrutoNum) || valorBrutoNum <= 0) {
      setErrorMessage('O valor mensal deve ser um número positivo.')
      return
    }

    if (percentualHonorariosNum !== undefined && (isNaN(percentualHonorariosNum) || percentualHonorariosNum < 0 || percentualHonorariosNum > 100)) {
      setErrorMessage('O percentual de honorários deve ser um número entre 0 e 100.')
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
        descricaoDescontos: descricaoDescontos.trim() || undefined,
        percentualHonorarios: percentualHonorariosNum
      })

      setShowModal(false)
      setDataInicioDireito('')
      setDataRequerimento(new Date().toISOString().split('T')[0])
      setValorMensalBruto('')
      setValorDescontos('0')
      setDescricaoDescontos('')
      setPercentualHonorarios('')
      addToast({ type: 'success', title: 'Retroativos calculados', message: 'Liquidação gerada com sucesso.' })
      load()
    } catch (err: unknown) {
      setErrorMessage((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Falha ao rodar o cálculo de retroativos.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = (retroId: string) => {
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

  return {
    retroativos,
    loading,
    creating,
    showModal,
    setShowModal,
    errorMessage,
    setErrorMessage,
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
    deleteTarget,
    setDeleteTarget,
    handleCreate,
    handleDelete,
    confirmDelete,
  }
}
