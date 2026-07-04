'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DatePicker } from '@/components/ui/DatePicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ModalitySelect } from '@/components/case/ModalitySelect'
import { CnisInfoCard } from '@/components/cases/CnisInfoCard'
import { useToast } from '@/store/toast'
import { useSimulator } from './_hooks/useSimulator'
import {
  TrendingUp,
  Scale,
  Calendar,
  ShieldAlert,
  Loader2,
  Trash2,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function SimulatorPage() {
  const { addToast } = useToast()
  const {
    simulations,
    cnisDocument,
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
  } = useSimulator()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="font-sans font-medium text-slate-500 mt-4">Carregando simulador de cenários...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Simulador de Planejamento</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Simule o impacto de contribuições futuras na aposentadoria do cliente.</p>
        </div>
        {simulations.length > 0 && (
          <Button
            onClick={() => {
              if (!cnisDocument) {
                addToast({ type: 'error', title: 'CNIS necessário', message: 'Faça upload do CNIS para realizar as simulações.' })
                return
              }
              setShowModal(true)
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm font-semibold"
          >
            <Compass className="w-4 h-4" />
            Nova Simulação
          </Button>
        )}
      </div>

      {simulations.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
            <Compass className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhuma Simulação Criada</h3>
          <p className="font-sans text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Projete cenários de contribuição futuros (ex: teto da previdência) e demonstre de forma muito visual o retorno sobre investimento (ROI) em reais.
          </p>
          <Button
            onClick={() => {
              if (!cnisDocument) {
                addToast({ type: 'error', title: 'CNIS necessário', message: 'Faça upload do CNIS para realizar as simulações.' })
                return
              }
              setShowModal(true)
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm"
          >
            <Compass className="w-4 h-4" />
            Iniciar Planejamento
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {simulations.map((sim) => {
            const paramsSim = sim.scenarioParams as {
              modalidade?: string
              valorContribuicaoFutura?: number
              competenciasSimuladas?: number
              tempoEspecialAnos?: number
              gender?: string
              elegivel?: boolean
              pendencias?: string[]
              idadeNaApuracaoAnos?: number
              idadeNaApuracaoMeses?: number
              tempoContribuicaoAnos?: number
            } | null | undefined
            const gain = Number(sim.gainVsNow)

            const ageYears = paramsSim?.idadeNaApuracaoAnos
            const ageMonths = paramsSim?.idadeNaApuracaoMeses
            const ageDisplay = typeof ageYears === 'number'
              ? `${ageYears} ano${ageYears !== 1 ? 's' : ''}${ageMonths ? ` e ${ageMonths} mê${ageMonths !== 1 ? 'ses' : 's'}` : ''}`
              : 'Não calculada'

            return (
              <div key={sim.id} className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
                {/* Header da Simulação */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-slate-800 text-base sm:text-lg">
                      {sim.scenarioName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Aposentadoria Simulada em: {formatDate(sim.dibProjected)}
                      </span>
                      {paramsSim?.modalidade && (
                        <span className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                          Modalidade: {modalidadeLabels[paramsSim.modalidade] ?? paramsSim.modalidade}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sim.id)}
                    className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors shrink-0 flex items-center gap-1.5 font-sans font-semibold text-xs self-start sm:self-center"
                    aria-label={`Excluir cenário "${sim.scenarioName}"`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Excluir Cenário
                  </button>
                </div>

                {/* Grid Visual de Comparação */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* Cenário Atual */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        RMI Estimada Hoje
                      </span>
                      <p className="font-sans font-bold text-slate-500 text-2xl tracking-tight">
                        {formatCurrency(Number(sim.rmiProjected) - gain)}
                      </p>
                    </div>
                    <span className="font-sans text-[10px] text-slate-400 italic block mt-4">
                      Valor sem contribuições futuras.
                    </span>
                  </div>

                  {/* Icon Seta */}
                  <div className="hidden md:flex items-center justify-center -mx-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Cenário Projetado */}
                  <div className="bg-amber-50/20 border border-amber-200/60 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                    <div className="absolute top-3 right-3">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-amber-700 block mb-1">
                        RMI Projetada Planejada
                      </span>
                      <p className="font-sans font-bold text-amber-600 text-2xl tracking-tight">
                        {formatCurrency(sim.rmiProjected)}
                      </p>
                    </div>
                    <span className="font-sans text-[10px] text-amber-700/80 font-semibold block mt-4">
                      Contribuição futura: {formatCurrency(paramsSim?.valorContribuicaoFutura || 1512)}/mês
                    </span>
                  </div>
                </div>

                {/* Ganho Destaque */}
                {gain > 0 && (
                  <div className="px-6 py-4 bg-emerald-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="font-sans text-xs font-bold text-emerald-800 block">Retorno do Planejamento Previdenciário</span>
                        <span className="font-sans text-xs text-emerald-600 font-medium">Incremento garantido todo mês após aposentar.</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-sans font-black text-emerald-600 text-lg sm:text-xl tracking-tight block">
                        + {formatCurrency(gain)}/mês
                      </span>
                    </div>
                  </div>
                )}

                {/* Bloco de Elegibilidade Premium */}
                {paramsSim && typeof paramsSim.elegivel === 'boolean' && (
                  <div className={`px-6 py-4 border-t border-slate-100 flex flex-col gap-3 ${paramsSim.elegivel ? 'bg-emerald-50/20' : 'bg-amber-50/10'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paramsSim.elegivel ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {paramsSim.elegivel ? (
                            <CheckCircle2 className="w-4.5 h-4.5" />
                          ) : (
                            <AlertCircle className="w-4.5 h-4.5" />
                          )}
                        </div>
                        <div>
                          <span className="font-sans text-xs font-bold text-slate-800 block">Diagnóstico de Aposentadoria na Data Projetada</span>
                          <span className="font-sans text-xs text-slate-500 font-medium">
                            Cenário simulado para {formatDate(sim.dibProjected)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${paramsSim.elegivel ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {paramsSim.elegivel ? 'Requisitos Atingidos' : 'Pré-requisitos Pendentes'}
                        </span>
                      </div>
                    </div>

                    {/* Pendências de forma visual premium */}
                    {!paramsSim.elegivel && paramsSim.pendencias && paramsSim.pendencias.length > 0 && (
                      <div className="mt-1 pl-10 space-y-1.5 border-l border-amber-200/50">
                        {paramsSim.pendencias.map((pend, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-sans text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{pend}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {paramsSim.elegivel && (
                      <div className="mt-1 pl-10 text-xs font-sans text-emerald-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>O segurado preencherá todos os requisitos legais na data projetada.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Detalhamento das Variáveis da Simulação */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-slate-600">
                  <div>
                    <span className="text-slate-400 font-bold block">MESES PLANEJADOS</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5">{paramsSim?.competenciasSimuladas ?? 0} contribuições</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">INVESTIMENTO ESTIMADO</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5">
                      {formatCurrency((paramsSim?.valorContribuicaoFutura || 1512) * (paramsSim?.competenciasSimuladas ?? 0))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">IDADE DE APOSENTADORIA</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5">{ageDisplay}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">FONTE DE DADOS</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5">Extrato CNIS Integrado</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Visual de Planejamento de Nova Simulação */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="NOVA SIMULAÇÃO DE APOSENTADORIA" size="lg">
        <div className="space-y-5">
          {errorMessage && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="font-sans text-sm font-medium text-red-700">{errorMessage}</p>
            </div>
          )}

          <CnisInfoCard cnisDocument={cnisDocument} />
          {cnisDocument?.extractedData && (
            <p className="font-sans text-[10px] text-slate-500 leading-relaxed">
              O simulador projetará as contribuições futuras a partir de hoje até a data pretendida, mesclando com o histórico acima.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Nome do Cenário de Simulação</label>
              <input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                placeholder="Ex: Planejamento Contribuindo no Teto até 2030"
              />
            </div>

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Gênero Jurídico</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </select>
            </div>

            <div>
              <DatePicker
                label="Data Pretendida de Aposentadoria"
                value={dibProjetada}
                onChange={(d) => setDibProjetada(d ? d.toISOString().split('T')[0] : '')}
              />
            </div>

            <ModalitySelect
              benefitType={caseBenefitType}
              modalidades={allModalidades}
              value={modalidade}
              onChange={setModalidade}
              label="Regra de Aposentadoria"
              hint=""
              selectClassName="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              labelClassName="font-sans font-bold text-xs text-slate-600 block mb-1"
            />

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Tempo Especial Atual (Anos)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={tempoEspecialAnos}
                onChange={(e) => setTempoEspecialAnos(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                placeholder="Ex: 12.5"
              />
            </div>

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Valor da Contribuição Futura</label>
              <select
                value={tipoContribuicao}
                onChange={(e) => setTipoContribuicao(e.target.value as 'MINIMO' | 'TETO' | 'CUSTOM')}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              >
                <option value="MINIMO">Sobre o Salário Mínimo ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salarioVigente.valor)})</option>
                <option value="TETO">Sobre o Teto Previdenciário ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salarioVigente.teto)})</option>
                <option value="CUSTOM">Outro Valor Customizado em R$</option>
              </select>
            </div>

            {tipoContribuicao === 'CUSTOM' && (
              <div className="animate-fade-in">
                <CurrencyInput
                  value={valorCustomContribuicao}
                  onChange={(val) => setValorCustomContribuicao(val)}
                  label="Salário de Contribuição Mensal Planejado (R$)"
                  placeholder="Ex: 3.000,00"
                  min={salarioVigente.valor}
                  max={10000}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Rodar Planejamento
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
