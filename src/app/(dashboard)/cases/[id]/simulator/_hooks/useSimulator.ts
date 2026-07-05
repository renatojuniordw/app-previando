'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { MODALIDADES_PADRAO, mapToPortugueseCode } from '@/lib/modalidade-labels'
import { useToast } from '@/store/toast'

interface Simulation {
  id: string
  scenarioName: string
  scenarioParams: unknown
  rmiProjected: string | number
  rmaProjected: string | number
  dibProjected: string
  gainVsNow: string | number
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
    periodos?: unknown[]
  }
}

export function useSimulator() {
  const params = useParams()
  const { addToast } = useToast()

  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [cnisDocument, setCnisDocument] = useState<CnisDocument | null>(null)
  const [caseBenefitType, setCaseBenefitType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [scenarioName, setScenarioName] = useState('')
  const [modalidade, setModalidade] = useState('APOSENTADORIA_IDADE')
  const [gender, setGender] = useState<'M' | 'F'>('F')
  const [dibProjetada, setDibProjetada] = useState('2030-01-01')
  const [tempoEspecialAnos, setTempoEspecialAnos] = useState(0)
  const [tipoContribuicao, setTipoContribuicao] = useState<'MINIMO' | 'TETO' | 'CUSTOM'>('MINIMO')
  const [valorCustomContribuicao, setValorCustomContribuicao] = useState(0)
  const [salarioVigente, setSalarioVigente] = useState({ valor: 0, teto: 0 })

  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const [rSim, rCnis, rModalidades, rCase] = await Promise.all([
        api.get(`/cases/${params.id}/simulations`),
        api.get(`/cnis/${params.id}`),
        api.get('/modalidades'),
        api.get(`/cases/${params.id}`),
      ])
      setSimulations(rSim.data.simulations ?? [])
      setModalidades(
        (rModalidades.data.modalidades ?? []).map((m: { codigo: string; label: string }) => ({
          ...m,
          codigo: mapToPortugueseCode(m.codigo),
        }))
      )
      setCaseBenefitType(rCase.data.case?.benefitType)

      if (rCnis.data?.cnisDocument?.processingStatus === 'COMPLETED' || rCnis.data?.cnisDocument?.processingStatus === 'SUMMARY_READY') {
        setCnisDocument(rCnis.data.cnisDocument)
      }

      const hoje = new Date().toISOString().slice(0, 10)
      const [rSalario] = await Promise.all([
        api.get(`/salario-minimo?dib=${hoje}`),
      ])
      setSalarioVigente({ valor: rSalario.data.valor, teto: rSalario.data.teto })
      setValorCustomContribuicao(rSalario.data.valor)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  const modalidadeLabels = Object.fromEntries(
    (modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map(({ codigo, label }) => [codigo, label])
  )

  const allModalidades = modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO

  const handleCreate = async () => {
    setErrorMessage('')

    if (!scenarioName.trim()) {
      setErrorMessage('Por favor, informe o nome do cenário.')
      return
    }

    if (!cnisDocument) {
      setErrorMessage('Para simular, primeiro envie e processe o extrato do CNIS na aba CNIS.')
      return
    }

    let valorContribuicaoFutura = salarioVigente.valor
    if (tipoContribuicao === 'TETO') {
      valorContribuicaoFutura = salarioVigente.teto
    } else if (tipoContribuicao === 'CUSTOM') {
      valorContribuicaoFutura = Number(valorCustomContribuicao)
    }

    setCreating(true)
    try {
      await api.post(`/cases/${params.id}/simulations`, {
        scenarioName,
        gender,
        dibProjetada,
        valorContribuicaoFutura,
        modalidade,
        tempoEspecialAnos: Number(tempoEspecialAnos),
      })

      setShowModal(false)
      setScenarioName('')
      setTempoEspecialAnos(0)
      setTipoContribuicao('MINIMO')
      setValorCustomContribuicao(salarioVigente.valor)
      addToast({ type: 'success', title: 'Simulação criada', message: 'Cenário de planejamento gerado com sucesso.' })
      load()
    } catch (err: unknown) {
      setErrorMessage((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Falha ao salvar a simulação no servidor.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (simId: string) => {
    try {
      await api.delete(`/cases/${params.id}/simulations/${simId}`)
      addToast({ type: 'success', title: 'Simulação excluída' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir a simulação.' })
    }
  }

  return {
    simulations,
    cnisDocument,
    modalidades,
    modalidadeLabels,
    allModalidades,
    loading,
    creating,
    showModal,
    setShowModal,
    errorMessage,
    setErrorMessage,
    scenarioName,
    setScenarioName,
    modalidade,
    setModalidade,
    gender,
    setGender,
    dibProjetada,
    setDibProjetada,
    tempoEspecialAnos,
    setTempoEspecialAnos,
    tipoContribuicao,
    setTipoContribuicao,
    valorCustomContribuicao,
    setValorCustomContribuicao,
    salarioVigente,
    caseBenefitType,
    handleCreate,
    handleDelete,
  }
}
