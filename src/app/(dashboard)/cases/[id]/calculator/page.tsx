'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { HelpText } from '@/components/ui/HelpText'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatDate } from '@/lib/utils'
import { MODALIDADES_PADRAO } from '@/lib/modalidade-labels'
import { ModalitySelect } from '@/components/case/ModalitySelect'
import { useToast } from '@/store/toast'
import { CnisInfoCard } from '@/components/cases/CnisInfoCard'
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  FileSpreadsheet,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'

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

const formatCurrency = (val: string | number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val))
}

const formatPercentage = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return 'N/A'
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(
    Number(val)
  )
}

export default function CalculatorPage() {
  const params = useParams()
  interface CnisDocument {
    extractedData?: {
      nome?: string
      nit?: string
      dataNascimento?: string
      periodos?: Array<unknown>
    }
    processingStatus?: string
  }

  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [cnisDocument, setCnisDocument] = useState<CnisDocument | null>(null)
  const [caseBenefitType, setCaseBenefitType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Parâmetros de Entrada Visual
  const [modalidade, setModalidade] = useState('APOSENTADORIA_IDADE')
  const [gender, setGender] = useState<'M' | 'F'>('F')
  const [dib, setDib] = useState(new Date().toISOString().split('T')[0])
  const [tempoEspecialAnos, setTempoEspecialAnos] = useState(0)
  const [dependentesPensao, setDependentesPensao] = useState(1)

  const { addToast } = useToast()
  const [expandedCalc, setExpandedCalc] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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
      // noop
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  const modalidadeLabels = Object.fromEntries(
    (modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map(({ codigo, label }) => [
      codigo,
      label,
    ])
  )

  const mapEnglishToPortugueseModality = (code: string): string => {
    const map: Record<string, string> = {
      RETIREMENT_BY_AGE: 'APOSENTADORIA_IDADE',
      MINIMUM_AGE_65_62: 'IDADE_MINIMA_65_62',
      CONTRIBUTION_TIME: 'TEMPO_CONTRIBUICAO',
      POINTS_86_96: 'PONTOS_86_96',
      TOLL_50: 'PEDAGIO_50',
      TOLL_100: 'PEDAGIO_100',
      SPECIAL_RETIREMENT: 'APOSENTADORIA_ESPECIAL',
      HYBRID: 'HIBRIDA',
      SICKNESS_BENEFIT_B31: 'AUXILIO_DOENCA_B31',
      SICKNESS_BENEFIT_B91: 'AUXILIO_DOENCA_B91',
      MATERNITY_PAY: 'SALARIO_MATERNIDADE',
      PRISONER_BENEFIT: 'AUXILIO_RECLUSAO',
      DEATH_PENSION: 'PENSAO_MORTE',
      BPC_LOAS: 'BPC_LOAS',
    }
    return map[code] || code
  }

  const getModalityLabel = (modalityCode: string | undefined | null) => {
    if (!modalityCode) return ''
    const localMap: Record<string, string> = {
      POINTS_86_96: 'Aposentadoria por Pontos (Transição)',
      TOLL_50: 'Transição - Pedágio de 50%',
      TOLL_100: 'Transição - Pedágio de 100%',
      MINIMUM_AGE_65_62: 'Idade Mínima Progressiva',
      CONTRIBUTION_TIME: 'Tempo de Contribuição (Regra Geral)',
      RETIREMENT_BY_AGE: 'Aposentadoria por Idade',
      SPECIAL_RETIREMENT: 'Aposentadoria Especial (25 anos)',
      HYBRID: 'Aposentadoria Híbrida',
      SICKNESS_BENEFIT_B31: 'Auxílio-Doença Previdenciário',
      SICKNESS_BENEFIT_B91: 'Auxílio-Doença Acidentário',
      MATERNITY_PAY: 'Salário-Maternidade',
      PRISONER_BENEFIT: 'Auxílio-Reclusão',
      DEATH_PENSION: 'Pensão por Morte',
      BPC_LOAS: 'BPC/LOAS (Idoso)',
      PONTOS_86_96: 'Aposentadoria por Pontos (Transição)',
      PEDAGIO_50: 'Transição - Pedágio de 50%',
      PEDAGIO_100: 'Transição - Pedágio de 100%',
      IDADE_MINIMA_65_62: 'Idade Mínima Progressiva',
      TEMPO_CONTRIBUICAO: 'Tempo de Contribuição (Regra Geral)',
      APOSENTADORIA_IDADE: 'Aposentadoria por Idade',
      APOSENTADORIA_ESPECIAL: 'Aposentadoria Especial (25 anos)',
      HIBRIDA: 'Aposentadoria Híbrida',
      AUXILIO_DOENCA_B31: 'Auxílio-Doença Previdenciário',
      AUXILIO_DOENCA_B91: 'Auxílio-Doença Acidentário',
      SALARIO_MATERNIDADE: 'Salário-Maternidade',
      AUXILIO_RECLUSAO: 'Auxílio-Reclusão',
      PENSAO_MORTE: 'Pensão por Morte',
    }
    return modalidadeLabels[modalityCode] || localMap[modalityCode] || modalityCode
  }

  const uniqueModalidades = Array.from(
    new Map(
      (modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map((item) => {
        const apiCode = mapEnglishToPortugueseModality(item.codigo)
        return [apiCode, { ...item, codigo: apiCode }]
      })
    ).values()
  )

  const handleCreate = async () => {
    setErrorMessage('')

    // Validações básicas
    if (!cnisDocument) {
      setErrorMessage(
        'Para realizar o cálculo, primeiro envie e processe o extrato do CNIS do cliente na aba CNIS.'
      )
      return
    }

    setCreating(true)
    try {
      // Envia apenas os parâmetros brutos de input para o servidor orquestrar de forma segura
      await api.post(`/cases/${params.id}/calculations`, {
        modalidade,
        dib,
        gender,
        tempoEspecialAnos: Number(tempoEspecialAnos),
        dependentesPensao: Number(dependentesPensao),
      })

      setShowModal(false)
      // Reseta formulários
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

  const handleDelete = async (calcId: string) => {
    setConfirmDelete(calcId)
  }

  const confirmDeleteCalc = async () => {
    if (!confirmDelete) return
    const id = confirmDelete
    setConfirmDelete(null)
    try {
      await api.delete(`/cases/${params.id}/calculations/${id}`)
      addToast({ type: 'success', title: 'Cálculo excluído' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o cálculo.' })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="mt-4 font-sans font-medium text-slate-500">
          Carregando painel de cálculos...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <HelpText title="Como usar a calculadora">
        Selecione a modalidade de aposentadoria e preencha os parâmetros para calcular o valor do benefício (RMI).
        As modalidades disponíveis dependem do perfil do cliente. Use a aba <strong>Comparar</strong> para ver
        modalidades lado a lado antes de decidir.
      </HelpText>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            Painel de Cálculos
          </h2>
          <p className="mt-1 font-sans text-sm text-slate-500">
            Realize cálculos de benefícios com base no CNIS.
          </p>
        </div>
        {calculations.length > 0 && (
          <Button
            onClick={() => {
              if (!cnisDocument) {
                addToast({
                  type: 'error',
                  title: 'CNIS necessário',
                  message: 'Faça upload do CNIS para realizar os cálculos.',
                })
                return
              }
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            <Scale className="h-4 w-4" />
            Novo Cálculo
          </Button>
        )}
      </div>

      {calculations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Scale className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-2 font-serif text-lg font-bold text-slate-900">
            Nenhum Cálculo Realizado
          </h3>
          <p className="mx-auto mb-6 max-w-md font-sans text-sm text-slate-500">
            Gere relatórios completos de RMI, RMA e elegibilidade jurídica para o cliente de forma
            visual e simples.
          </p>
          <Button
            onClick={() => {
              if (!cnisDocument) {
                addToast({
                  type: 'error',
                  title: 'CNIS necessário',
                  message: 'Faça upload do CNIS para realizar os cálculos.',
                })
                return
              }
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-amber-600 text-white shadow-sm hover:bg-amber-700"
          >
            <Scale className="h-4 w-4" />
            Iniciar Primeiro Cálculo
          </Button>
        </div>
      ) : (
        <div className="space-y-4" aria-live="polite" aria-label="Lista de cálculos">
          {calculations.map((calc) => {
            const isExpanded = expandedCalc === calc.id
            const parsedInput = calc.inputParams
            const isCalcElegivel = calc.eligible

            return (
              <div
                key={calc.id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
                  calc.isSelected ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-200'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-col justify-between gap-4 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-base font-bold text-slate-800 sm:text-lg">
                        {getModalityLabel(calc.modality)}
                      </span>
                      {calc.isSelected && (
                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          Selecionado p/ Relatório
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        DIB: {formatDate(calc.expectedDib || calc.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Gênero: {parsedInput?.gender === 'M' ? 'Masculino' : 'Feminino'}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCalc(isExpanded ? null : calc.id)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      {isExpanded ? (
                        <>
                          Recolher Detalhes
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Ver Detalhes
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {!calc.isSelected && (
                      <button
                        onClick={() => handleSelect(calc.id)}
                        className="cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-sans text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        aria-label="Selecionar este cálculo como referência"
                      >
                        Selecionar
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(calc.id)}
                      className="cursor-pointer rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      aria-label="Excluir este cálculo"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Exibição Visual dos Ganhos Principais */}
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6">
                  <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      RMI (Inicial)
                    </span>
                    <span className="font-sans text-xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(calc.rmi)}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Salário de Benefício (Média)
                    </span>
                    <span className="font-sans text-xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(calc.benefitSalary)}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Elegibilidade Previdenciária
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      {isCalcElegivel ? (
                        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <ShieldCheck className="h-4 w-4" />
                          Elegível
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                          <ShieldAlert className="h-4 w-4" />
                          Requisitos Pendentes
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhamento Acordeão */}
                {isExpanded && (
                  <div className="animate-fade-in space-y-6 border-t border-slate-200 bg-slate-50/20 p-6">
                    {/* Exibição de Pendências */}
                    {!isCalcElegivel && calc.pendingIssues && calc.pendingIssues.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/50 p-5">
                        <span className="flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-rose-700">
                          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />O que falta para conceder o
                          benefício?
                        </span>
                        <ul className="list-disc space-y-1 pl-5 font-sans text-sm text-rose-800">
                          {calc.pendingIssues.map((pend, pIdx) => (
                            <li key={pIdx}>{pend}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resumo de Dados Previdenciários */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <span className="mb-1 block font-sans text-[10px] font-bold text-slate-400">
                          Tempo Contribuição
                        </span>
                        <span className="font-sans text-sm font-bold text-slate-800">
                          {calc.contributionTime ? (calc.contributionTime / 12).toFixed(1) : '0'}{' '}
                          anos
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <span className="mb-1 block font-sans text-[10px] font-bold text-slate-400">
                          Carência Apurada
                        </span>
                        <span className="font-sans text-sm font-bold text-slate-800">
                          {calc.gracePeriodMet ? 'Atendida' : 'Não Atendida'}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <span className="mb-1 block font-sans text-[10px] font-bold text-slate-400">
                          Alíquota / Coeficiente
                        </span>
                        <span className="font-sans text-sm font-bold text-slate-800">
                          {formatPercentage(calc.coefficient)}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <span className="mb-1 block font-sans text-[10px] font-bold text-slate-400">
                          Idade na Apuração
                        </span>
                        <span className="font-sans text-sm font-bold text-slate-800">
                          {calc.ageAtCalculation ?? 'N/A'} anos
                        </span>
                      </div>
                    </div>

                    {/* Memória de Cálculo Expansível */}
                    {calc.calculationMemory && (
                      <div className="space-y-3">
                        <span className="flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
                          <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                          Memória de Cálculo (Detalhamento da Média)
                        </span>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                            <span>FÓRMULA PREVIDENCIÁRIA</span>
                            <span>MÉDIA POŚ-1994 (100% DAS CONTRIBUIÇÕES)</span>
                          </div>

                          <div className="space-y-4 p-4">
                            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 font-sans text-sm sm:flex-row">
                              <div>
                                <p className="text-slate-500">Contribuições computadas:</p>
                                <p className="font-bold text-slate-800">
                                  {calc.calculationMemory.contribuicoesConsideradas ?? 'N/A'}{' '}
                                  competências
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Gênero utilizado:</p>
                                <p className="font-bold text-slate-800">
                                  {calc.calculationMemory.genero ?? 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Piso Nacional (Salário Mínimo):</p>
                                <p className="font-bold text-slate-800">
                                  {calc.calculationMemory.pisoNacional
                                    ? formatCurrency(calc.calculationMemory.pisoNacional)
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Teto da Previdência:</p>
                                <p className="font-bold text-slate-800">
                                  {calc.calculationMemory.tetoPrevidenciario
                                    ? formatCurrency(calc.calculationMemory.tetoPrevidenciario)
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Tabela Parcial de Salários */}
                            {calc.calculationMemory.detalhamentoMedia &&
                              calc.calculationMemory.detalhamentoMedia.length > 0 && (
                                <div className="space-y-2">
                                  <span className="block font-sans text-[10px] font-bold text-slate-400">
                                    Primeiros Salários do Período de Cálculo:
                                  </span>
                                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                                    {calc.calculationMemory.detalhamentoMedia.map((sal, sIdx) => {
                                      const parts = sal.competencia.split('-')
                                      const compFormat =
                                        parts.length === 2
                                          ? `${parts[1]}/${parts[0]}`
                                          : sal.competencia
                                      return (
                                        <div
                                          key={sIdx}
                                          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                                        >
                                          <span className="font-sans text-[10px] font-bold text-slate-400">
                                            {compFormat}
                                          </span>
                                          <span className="mt-0.5 font-sans text-xs font-bold text-slate-800">
                                            {formatCurrency(sal.valorAjustado)}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  <p className="mt-1 font-sans text-[10px] italic text-slate-400">
                                    * Mostrando as primeiras competências utilizadas para
                                    verificação do piso/teto.
                                  </p>
                                </div>
                              )}
                          </div>
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

      {/* Modal Visual de Novo Cálculo */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Configurar novo cálculo"
        size="lg"
      >
        <div className="space-y-5">
          {errorMessage && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
              <p className="font-sans text-sm font-medium text-red-700">{errorMessage}</p>
            </div>
          )}

          <CnisInfoCard cnisDocument={cnisDocument} />

          <div className="space-y-4">
            <div>
              <label htmlFor="genero" className="neo-label">
                Gênero jurídico do segurado
              </label>
              <select
                id="genero"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="neo-input"
                aria-describedby="genero-hint"
              >
                <option value="F">Feminino (Regra Geral 62 Anos / 15 TC)</option>
                <option value="M">Masculino (Regra Geral 65 Anos / 20 TC)</option>
              </select>
              <p id="genero-hint" className="mt-1 font-sans text-[10px] text-slate-400">
                Define as regras de idade e tempo de contribuição aplicáveis
              </p>
            </div>

            <div>
              <DatePicker
                label="DIB pretendida (início do benefício)"
                value={dib}
                onChange={(d) => setDib(d ? d.toISOString().split('T')[0] : '')}
              />
            </div>

            <ModalitySelect
              benefitType={caseBenefitType}
              modalidades={uniqueModalidades}
              value={modalidade}
              onChange={setModalidade}
              label="Regra / modalidade previdenciária"
              hint="Escolha a modalidade que melhor se enquadra ao perfil do segurado"
              selectClassName="neo-input"
              labelClassName="neo-label"
            />

            {/* Parâmetros Avançados baseados na Modalidade */}
            {modalidade === 'APOSENTADORIA_ESPECIAL' && (
              <div className="animate-fade-in">
                <label htmlFor="tempo-especial" className="neo-label">
                  Conversão de atividade especial (anos já comprovados)
                </label>
                <input
                  id="tempo-especial"
                  type="number"
                  min="0"
                  max="40"
                  value={tempoEspecialAnos}
                  onChange={(e) => setTempoEspecialAnos(Number(e.target.value))}
                  className="neo-input"
                  placeholder="Ex: 5"
                  aria-describedby="tempo-especial-hint"
                />
                <p id="tempo-especial-hint" className="mt-1 font-sans text-[10px] text-slate-400">
                  Será adicionado o multiplicador de atividade insalubre correspondente ao gênero
                </p>
              </div>
            )}

            {modalidade === 'PENSAO_MORTE' && (
              <div className="animate-fade-in">
                <label htmlFor="dependentes" className="neo-label">
                  Número de dependentes habilitados
                </label>
                <input
                  id="dependentes"
                  type="number"
                  min="1"
                  max="10"
                  value={dependentesPensao}
                  onChange={(e) => setDependentesPensao(Number(e.target.value))}
                  className="neo-input"
                  aria-describedby="dependentes-hint"
                />
                <p id="dependentes-hint" className="mt-1 font-sans text-[10px] text-slate-400">
                  A cota é acrescida de 10% por dependente (partindo de 50% base até 100%)
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-3">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-amber-600 font-semibold text-white hover:bg-amber-700"
            >
              Calcular Benefício
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1 border-slate-300 font-semibold text-slate-700"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onConfirm={confirmDeleteCalc}
        onCancel={() => setConfirmDelete(null)}
        title="Excluir cálculo?"
        message="Tem certeza que deseja excluir este cálculo? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  )
}
