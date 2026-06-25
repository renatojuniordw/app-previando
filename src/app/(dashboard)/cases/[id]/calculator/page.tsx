'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { MODALIDADES_PADRAO } from '@/lib/modalidade-labels'
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
  Loader2
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
  modalidade: string
  inputParams: InputParams
  salarioBeneficio: string | number
  rmi: string | number
  rma: string | number
  fatorPrevidenciario?: string | number | null
  coeficiente?: string | number | null
  dibPrevista?: string | null
  carenciaAtendida: boolean
  tempoContribuicao?: number | null
  idadeNaApuracao?: number | null
  elegivel: boolean
  pendencias: string[]
  memoriaCalculo: MemoriaCalculo | null
  periodosSalarios: PeriodosSalarios | null
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
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(Number(val))
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

  const load = useCallback(async () => {
    try {
      const [rCalc, rCnis, rModalidades] = await Promise.all([
        api.get(`/cases/${params.id}/calculations`),
        api.get(`/cnis/${params.id}`),
        api.get('/modalidades'),
      ])
      setCalculations(rCalc.data.calculations ?? [])
      setModalidades(rModalidades.data.modalidades ?? [])

      if (rCnis.data?.cnisDocument?.processingStatus === 'COMPLETED' || rCnis.data?.cnisDocument?.processingStatus === 'SUMMARY_READY') {
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
    (modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map(({ codigo, label }) => [codigo, label])
  )

  const handleCreate = async () => {
    setErrorMessage('')
    
    // Validações básicas
    if (!cnisDocument) {
      setErrorMessage('Para realizar o cálculo, primeiro envie e processe o extrato do CNIS do cliente na aba CNIS.')
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
      addToast({ type: 'success', title: 'Cálculo criado', message: 'O benefício foi calculado com sucesso.' })
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
      addToast({ type: 'info', title: 'Cálculo selecionado', message: 'Usado como referência para relatórios.' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível selecionar o cálculo.' })
    }
  }

  const handleDelete = async (calcId: string) => {
    try {
      await api.delete(`/cases/${params.id}/calculations/${calcId}`)
      addToast({ type: 'success', title: 'Cálculo excluído' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o cálculo.' })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="font-sans font-medium text-slate-500 mt-4">Carregando painel de cálculos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Painel de Cálculos</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Realize cálculos de benefícios com base no CNIS.</p>
        </div>
        <Button
          onClick={() => {
            if (!cnisDocument) {
              alert('Por favor, primeiro envie e processe o documento CNIS deste caso.')
              return
            }
            setShowModal(true)
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm font-semibold"
        >
          <Scale className="w-4 h-4" />
          Novo Cálculo
        </Button>
      </div>

      {calculations.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
            <Scale className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhum Cálculo Realizado</h3>
          <p className="font-sans text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Gere relatórios completos de RMI, RMA e elegibilidade jurídica para o cliente de forma visual e simples.
          </p>
          <Button
            onClick={() => {
              if (!cnisDocument) {
                alert('Por favor, primeiro envie e processe o documento CNIS deste caso.')
                return
              }
              setShowModal(true)
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm"
          >
            <Scale className="w-4 h-4" />
            Iniciar Primeiro Cálculo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {calculations.map((calc) => {
            const isExpanded = expandedCalc === calc.id
            const parsedInput = calc.inputParams
            const isCalcElegivel = calc.elegivel

            return (
              <div
                key={calc.id}
                className={`border rounded-xl shadow-sm overflow-hidden transition-all bg-white ${
                  calc.isSelected ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-200'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-slate-800 text-base sm:text-lg">
                        {modalidadeLabels[calc.modalidade] ?? calc.modalidade}
                      </span>
                      {calc.isSelected && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0">
                          Selecionado p/ Relatório
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        DIB: {formatDate(calc.dibPrevista || calc.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Gênero: {parsedInput?.gender === 'M' ? 'Masculino' : 'Feminino'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedCalc(isExpanded ? null : calc.id)}
                      className="font-sans font-semibold text-xs text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      {isExpanded ? (
                        <>
                          Recolher Detalhes
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Ver Detalhes
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {!calc.isSelected && (
                      <button
                        onClick={() => handleSelect(calc.id)}
                        className="font-sans font-semibold text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Selecionar
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(calc.id)}
                      className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Excluir Cálculo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Exibição Visual dos Ganhos Principais */}
                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      RMI (Inicial)
                    </span>
                    <span className="font-sans font-bold text-slate-900 text-xl tracking-tight">
                      {formatCurrency(calc.rmi)}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Salário de Benefício (Média)
                    </span>
                    <span className="font-sans font-bold text-slate-900 text-xl tracking-tight">
                      {formatCurrency(calc.salarioBeneficio)}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Elegibilidade Previdenciária
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {isCalcElegivel ? (
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          Elegível
                        </div>
                      ) : (
                        <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" />
                          Requisitos Pendentes
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhamento Acordeão */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-150 bg-slate-50/20 space-y-6 animate-slide-down">
                    {/* Exibição de Pendências */}
                    {!isCalcElegivel && calc.pendencias && calc.pendencias.length > 0 && (
                      <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-5 space-y-2">
                        <span className="font-sans text-xs uppercase font-bold tracking-wider text-rose-700 flex items-center gap-1.5">
                          <ShieldAlert className="w-4.5 h-4.5" />
                          O que falta para conceder o benefício?
                        </span>
                        <ul className="list-disc pl-5 font-sans text-sm text-rose-800 space-y-1">
                          {calc.pendencias.map((pend, pIdx) => (
                            <li key={pIdx}>{pend}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resumo de Dados Previdenciários */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <span className="font-sans text-[10px] text-slate-400 font-bold block mb-1">Tempo Contribuição</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">
                          {calc.tempoContribuicao ? (calc.tempoContribuicao / 12).toFixed(1) : '0'} anos
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <span className="font-sans text-[10px] text-slate-400 font-bold block mb-1">Carência Apurada</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">
                          {calc.carenciaAtendida ? 'Atendida' : 'Não Atendida'}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <span className="font-sans text-[10px] text-slate-400 font-bold block mb-1">Alíquota / Coeficiente</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">
                          {formatPercentage(calc.coeficiente)}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <span className="font-sans text-[10px] text-slate-400 font-bold block mb-1">Idade na Apuração</span>
                        <span className="font-sans font-bold text-slate-800 text-sm">
                          {calc.idadeNaApuracao ?? 'N/A'} anos
                        </span>
                      </div>
                    </div>

                    {/* Memória de Cálculo Expansível */}
                    {calc.memoriaCalculo && (
                      <div className="space-y-3">
                        <span className="font-sans text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                          Memória de Cálculo (Detalhamento da Média)
                        </span>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
                            <span>FÓRMULA PREVIDENCIÁRIA</span>
                            <span>MÉDIA POŚ-1994 (100% DAS CONTRIBUIÇÕES)</span>
                          </div>
                          
                          <div className="p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between gap-4 font-sans text-sm pb-4 border-b border-slate-100">
                              <div>
                                <p className="text-slate-500">Contribuições computadas:</p>
                                <p className="font-bold text-slate-800">{calc.memoriaCalculo.contribuicoesConsideradas ?? 'N/A'} competências</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Gênero utilizado:</p>
                                <p className="font-bold text-slate-800">{calc.memoriaCalculo.genero ?? 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Piso Nacional (Salário Mínimo):</p>
                                <p className="font-bold text-slate-800">{formatCurrency(calc.memoriaCalculo.pisoNacional || 1621)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Teto da Previdência:</p>
                                <p className="font-bold text-slate-800">{formatCurrency(calc.memoriaCalculo.tetoPrevidenciario || 8157.41)}</p>
                              </div>
                            </div>

                            {/* Tabela Parcial de Salários */}
                            {calc.memoriaCalculo.detalhamentoMedia && calc.memoriaCalculo.detalhamentoMedia.length > 0 && (
                              <div className="space-y-2">
                                <span className="font-sans text-[10px] text-slate-400 font-bold block">Primeiros Salários do Período de Cálculo:</span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                  {calc.memoriaCalculo.detalhamentoMedia.map((sal, sIdx) => {
                                    const parts = sal.competencia.split('-')
                                    const compFormat = parts.length === 2 ? `${parts[1]}/${parts[0]}` : sal.competencia
                                    return (
                                      <div key={sIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
                                        <span className="font-sans text-[10px] text-slate-400 font-bold">{compFormat}</span>
                                        <span className="font-sans font-bold text-slate-800 text-xs mt-0.5">{formatCurrency(sal.valorAjustado)}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                                <p className="font-sans text-[10px] text-slate-400 italic mt-1">* Mostrando as primeiras competências utilizadas para verificação do piso/teto.</p>
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title="CONFIGURAR NOVO CÁLCULO" size="lg">
        <div className="space-y-5">
          {errorMessage && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="font-sans text-sm font-medium text-red-700">{errorMessage}</p>
            </div>
          )}

          <CnisInfoCard cnisDocument={cnisDocument} />

          <div className="space-y-4">
            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Gênero Jurídico do Segurado</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              >
                <option value="F">Feminino (Regra Geral 62 Anos / 15 TC)</option>
                <option value="M">Masculino (Regra Geral 65 Anos / 20 TC)</option>
              </select>
            </div>

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">DIB Pretendida (Início Benefício)</label>
              <input
                type="date"
                value={dib}
                onChange={(e) => setDib(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Regra / Modalidade Previdenciária</label>
              <select
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              >
                {(modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map((item) => (
                  <option key={item.codigo} value={item.codigo}>{item.label}</option>
                ))}
              </select>
            </div>

            {/* Parâmetros Avançados baseados na Modalidade */}
            {modalidade === 'APOSENTADORIA_ESPECIAL' && (
              <div className="animate-slide-down">
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Conversão de Atividade Especial (Anos já comprovados)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={tempoEspecialAnos}
                  onChange={(e) => setTempoEspecialAnos(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                  placeholder="Ex: 5"
                />
                <span className="font-sans text-[10px] text-slate-400 mt-1 block">Será adicionado o multiplicador de atividade insalubre correspondente ao gênero.</span>
              </div>
            )}

            {modalidade === 'PENSAO_MORTE' && (
              <div className="animate-slide-down">
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Número de Dependentes Habilitados</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={dependentesPensao}
                  onChange={(e) => setDependentesPensao(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                />
                <span className="font-sans text-[10px] text-slate-400 mt-1 block">A cota é acrescida de 10% por dependente (partindo de 50% base até 100%).</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Calcular Benefício
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
