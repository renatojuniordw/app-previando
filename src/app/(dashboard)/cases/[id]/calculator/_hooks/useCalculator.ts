'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { MODALIDADES_PADRAO, mapToPortugueseCode } from '@/lib/modalidade-labels'
import { useToast } from '@/store/toast'

interface InputParams {
  birthDate?: string
  gender?: 'M' | 'F'
  dib?: string
  tempoEspecialAnos?: number
  dependentesPensao?: number
  clientName?: string
}

interface MemoriaCalculo {
  contribuicoesConsideradas?: number
  genero?: string
  pisoNacional?: number
  tetoPrevidenciario?: number
  detalhamentoMedia?: Array<{
    competencia: string
    valorAjustado: number
    valorOriginal: number
  }>
}

interface PeriodosSalarios {
  totalContribuicoes?: number
  primeiraContribuicao?: string
  ultimaContribuicao?: string
}

interface Calculation {
  id: string
  modality: string
  inputParams: InputParams
  benefitSalary: string | number
  rmi: string | number
  rma: string | number
  socialSecurityFactor?: string | number | null
  coefficient?: string | number | null
  expectedDib?: string | null
  gracePeriodMet: boolean
  contributionTime?: number | null
  ageAtCalculation?: number | null
  eligible: boolean
  pendingIssues: string[]
  calculationMemory: MemoriaCalculo | null
  salaryPeriods: PeriodosSalarios | null
  isSelected: boolean
  createdAt: string
}

interface Modalidade {
  codigo: string
  label: string
}

interface CnisDocument {
  extractedData?: {
    nome?: string
    nit?: string
    dataNascimento?: string
    periodos?: Array<unknown>
  }
  processingStatus?: string
}

export function useCalculator() {
  const params = useParams()
  const { addToast } = useToast()

  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [cnisDocument, setCnisDocument] = useState<CnisDocument | null>(null)
  const [caseBenefitType, setCaseBenefitType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [modalidade, setModalidade] = useState('APOSENTADORIA_IDADE')
  const [gender, setGender] = useState<'M' | 'F'>('F')
  const [dib, setDib] = useState(new Date().toISOString().split('T')[0])
  const [tempoEspecialAnos, setTempoEspecialAnos] = useState(0)
  const [dependentesPensao, setDependentesPensao] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [rCalc, rCnis, rModalidades, rCase] = await Promise.all([
        api.get(`/cases/${params.id}/calculations`),
        api.get(`/cnis/${params.id}`),
        api.get('/modalidades'),
        api.get(`/cases/${params.id}`),
      ])
      setCalculations(rCalc.data.calculations ?? [])
      setModalidades(rModalidades.data.modalidades ?? [])
      const benefitType = rCase.data.case?.benefitType
      setCaseBenefitType(benefitType)

      if (
        rCnis.data?.cnisDocument?.processingStatus === 'COMPLETED' ||
        rCnis.data?.cnisDocument?.processingStatus === 'SUMMARY_READY'
      ) {
        setCnisDocument(rCnis.data.cnisDocument)
      }
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar dados do cálculo.' })
    } finally {
      setLoading(false)
    }
  }, [params.id, addToast])

  useEffect(() => {
    load()
  }, [load])

  const uniqueModalidades = Array.from(
    new Map(
      (modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map((item) => {
        const apiCode = mapToPortugueseCode(item.codigo)
        return [apiCode, { ...item, codigo: apiCode }]
      })
    ).values()
  )

  const modalidadeLabels = Object.fromEntries(
    (modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map(({ codigo, label }) => [codigo, label])
  )

  const handleCreate = async () => {
    setErrorMessage('')

    if (!cnisDocument) {
      setErrorMessage(
        'Para realizar o cálculo, primeiro envie e processe o extrato do CNIS do cliente na aba CNIS.'
      )
      return
    }

    setCreating(true)
    try {
      await api.post(`/cases/${params.id}/calculations`, {
        modalidade,
        dib,
        gender,
        tempoEspecialAnos: Number(tempoEspecialAnos),
        dependentesPensao: Number(dependentesPensao),
      })

      setShowModal(false)
      setTempoEspecialAnos(0)
      setDependentesPensao(1)
      addToast({
        type: 'success',
        title: 'Cálculo criado',
        message: 'O benefício foi calculado com sucesso.',
      })
      load()
    } catch (err) {
      const apiError = err as { response?: { data?: { error?: string } } }
      setErrorMessage(apiError.response?.data?.error ?? 'Falha ao salvar o cálculo no servidor.')
    } finally {
      setCreating(false)
    }
  }

  const handleSelect = async (calcId: string) => {
    try {
      await api.patch(`/cases/${params.id}/calculations/${calcId}/select`)
      addToast({
        type: 'info',
        title: 'Cálculo selecionado',
        message: 'Usado como referência para relatórios.',
      })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível selecionar o cálculo.' })
    }
  }

  const handleDelete = (calcId: string) => {
    setDeleteTarget(calcId)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)
    try {
      await api.delete(`/cases/${params.id}/calculations/${id}`)
      addToast({ type: 'success', title: 'Cálculo excluído' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o cálculo.' })
    }
  }

  return {
    calculations,
    cnisDocument,
    modalidades,
    modalidadeLabels,
    loading,
    creating,
    showModal,
    setShowModal,
    errorMessage,
    setErrorMessage,
    uniqueModalidades,
    deleteTarget,
    setDeleteTarget,
    modalidade,
    setModalidade,
    gender,
    setGender,
    dib,
    setDib,
    tempoEspecialAnos,
    setTempoEspecialAnos,
    dependentesPensao,
    setDependentesPensao,
    caseBenefitType,
    handleCreate,
    handleSelect,
    handleDelete,
    confirmDelete,
  }
}
