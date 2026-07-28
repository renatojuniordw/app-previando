'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DatePicker } from '@/components/ui/DatePicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { ModalitySelect } from '@/components/case/ModalitySelect'
import { CnisInfoCard } from '@/components/cases/CnisInfoCard'
import { useToast } from '@/store/toast'
import { useSimulator } from './_hooks/useSimulator'
import { useState } from 'react'
import {
  TrendingUp,
  Scale,
  Calendar,
  ShieldAlert,
  Trash2,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Clock,
  User,
  Target,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

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

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // BPC/LOAS é benefício assistencial e não depende de tempo de contribuição, logo dispensa o CNIS.
  const requiresCnis = caseBenefitType !== 'BPC_LOAS'

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-64 h-8" />
            <Skeleton variant="text" className="w-96 h-4" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6 space-y-4">
          <Skeleton variant="text" className="w-48 h-6" />
          <Skeleton variant="rectangular" className="w-full h-32" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton variant="rectangular" className="h-20" count={4} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            Simulador de Planejamento
          </h1>
          <p className="mt-1 font-sans text-sm text-slate-500">
            Projete cenários de contribuição futuros e calcule o retorno previdenciário do investimento.
          </p>
        </div>
        {simulations.length > 0 && (
          <Button
            onClick={() => {
              if (requiresCnis && !cnisDocument) {
                addToast({ type: 'error', title: 'CNIS necessário', message: 'Faça upload do CNIS para realizar as simulações.' })
                return
              }
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            <Compass className="h-4 w-4" />
            Nova Simulação
          </Button>
        )}
      </div>

      {/* Help Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3.5">
        <Compass className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="font-sans text-xs font-semibold leading-relaxed text-amber-900">
          Projete cenários de contribuição futuros (ex: teto da previdência) e demonstre de forma visual o retorno sobre investimento (ROI) em reais ao cliente.
        </p>
      </div>

      {/* Empty State */}
      {simulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 shadow-sm">
            <Compass className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mb-2 font-serif text-lg font-bold text-slate-900">
            Nenhuma Simulação Criada
          </h2>
          <p className="mx-auto mb-7 max-w-sm font-sans text-sm leading-relaxed text-slate-500">
            Projete cenários de contribuição futuros e demonstre de forma visual o ROI em reais para seu cliente.
          </p>
          <Button
            onClick={() => {
              if (requiresCnis && !cnisDocument) {
                addToast({ type: 'error', title: 'CNIS necessário', message: 'Faça upload do CNIS para realizar as simulações.' })
                return
              }
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-amber-600 text-white shadow-sm hover:bg-amber-700"
          >
            <Compass className="h-4 w-4" />
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
            const rmiAtual = Number(sim.rmiProjected) - gain
            const investimentoTotal = (paramsSim?.valorContribuicaoFutura || 0) * (paramsSim?.competenciasSimuladas ?? 0)

            const ageYears = paramsSim?.idadeNaApuracaoAnos
            const ageMonths = paramsSim?.idadeNaApuracaoMeses
            const ageDisplay = typeof ageYears === 'number'
              ? `${ageYears} ano${ageYears !== 1 ? 's' : ''}${ageMonths ? ` e ${ageMonths} mê${ageMonths !== 1 ? 'ses' : 's'}` : ''}`
              : '—'

            return (
              <div
                key={sim.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300"
              >
                {/* Top accent stripe */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                {/* Card Header */}
                <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-start">
                  <div className="space-y-1.5 min-w-0">
                    <h2 className="font-serif text-lg font-bold tracking-tight text-slate-900 truncate">
                      {sim.scenarioName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        Aposentadoria em: <span className="font-mono">{formatDate(sim.dibProjected)}</span>
                      </span>
                      {paramsSim?.modalidade && (
                        <span className="flex items-center gap-1.5">
                          <Scale className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          {modalidadeLabels[paramsSim.modalidade] ?? paramsSim.modalidade}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteTargetId(sim.id)}
                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-red-200 px-3 py-2 font-sans text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:self-center"
                    aria-label={`Excluir cenário "${sim.scenarioName}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir
                  </button>
                </div>

                {/* RMI Comparison (Before → After) */}
                <div className="grid grid-cols-1 gap-0 border-t border-slate-100 md:grid-cols-[1fr_auto_1fr]">
                  {/* Atual */}
                  <div className="flex flex-col gap-1 p-6">
                    <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      RMI Estimada Hoje
                    </span>
                    <p className="font-mono text-2xl font-bold tracking-tight text-slate-500">
                      {formatCurrency(rmiAtual)}
                    </p>
                    <span className="mt-1 font-sans text-[10px] italic text-slate-400">
                      Sem contribuições futuras planejadas
                    </span>
                  </div>

                  {/* Arrow Divider */}
                  <div className="hidden items-center justify-center md:flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 shadow-sm">
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Projetado */}
                  <div className="relative flex flex-col gap-1 border-t border-amber-100/60 bg-amber-50/20 p-6 md:border-t-0 md:border-l">
                    <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                      RMI Projetada com Planejamento
                    </span>
                    <p className="font-mono text-2xl font-bold tracking-tight text-amber-600">
                      {formatCurrency(sim.rmiProjected)}
                    </p>
                    <span className="mt-1 font-sans text-[10px] font-semibold text-amber-700/80">
                      Contrib. futura: {formatCurrency(paramsSim?.valorContribuicaoFutura || 0)}/mês
                    </span>
                    <TrendingUp className="absolute right-5 top-5 h-5 w-5 text-emerald-500" aria-hidden="true" />
                  </div>
                </div>

                {/* Gain Banner */}
                {gain > 0 && (
                  <div className="flex items-center justify-between gap-4 border-t border-emerald-100 bg-emerald-50/30 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-600 shadow-sm">
                        <TrendingUp className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="block font-sans text-xs font-bold text-emerald-800">
                          Retorno Mensal do Planejamento Previdenciário
                        </span>
                        <span className="font-sans text-[10px] font-semibold text-emerald-600">
                          Incremento garantido todo mês após aposentar
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xl font-black tracking-tight text-emerald-600 whitespace-nowrap">
                      + {formatCurrency(gain)}/mês
                    </span>
                  </div>
                )}

                {/* Eligibility Block */}
                {paramsSim && typeof paramsSim.elegivel === 'boolean' && (
                  <div className={cn(
                    'border-t border-slate-100 px-6 py-4 space-y-3',
                    paramsSim.elegivel ? 'bg-emerald-50/20' : 'bg-amber-50/10'
                  )}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm',
                          paramsSim.elegivel
                            ? 'border-emerald-200 bg-white text-emerald-600'
                            : 'border-amber-200 bg-white text-amber-600'
                        )}>
                          {paramsSim.elegivel
                            ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            : <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          }
                        </div>
                        <div>
                          <span className="block font-sans text-xs font-bold text-slate-800">
                            Diagnóstico de Aposentadoria na Data Projetada
                          </span>
                          <span className="font-sans text-[10px] font-semibold text-slate-500">
                            Cenário simulado para {formatDate(sim.dibProjected)}
                          </span>
                        </div>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider',
                        paramsSim.elegivel
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      )}>
                        {paramsSim.elegivel ? 'Requisitos Atingidos' : 'Pré-requisitos Pendentes'}
                      </span>
                    </div>

                    {/* Pending Issues */}
                    {!paramsSim.elegivel && paramsSim.pendencias && paramsSim.pendencias.length > 0 && (
                      <div className="space-y-1.5 border-l-2 border-amber-200 pl-4">
                        {paramsSim.pendencias.map((pend, idx) => (
                          <div key={idx} className="flex items-start gap-2 font-sans text-xs text-amber-800">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                            {pend}
                          </div>
                        ))}
                      </div>
                    )}

                    {paramsSim.elegivel && (
                      <div className="flex items-start gap-2 border-l-2 border-emerald-300 pl-4 font-sans text-xs text-emerald-800">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                        O segurado preencherá todos os requisitos legais na data projetada.
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Stats Strip */}
                <div className="grid grid-cols-2 gap-0 border-t border-slate-100 bg-slate-50/40 sm:grid-cols-4">
                  <StatCell icon={<Clock className="h-3.5 w-3.5" />} label="Meses Planejados">
                    {paramsSim?.competenciasSimuladas ?? 0} contribuições
                  </StatCell>
                  <StatCell icon={<Banknote className="h-3.5 w-3.5" />} label="Investimento Total" bordered>
                    {formatCurrency(investimentoTotal)}
                  </StatCell>
                  <StatCell icon={<User className="h-3.5 w-3.5" />} label="Idade de Aposentadoria" bordered>
                    {ageDisplay}
                  </StatCell>
                  <StatCell icon={<Target className="h-3.5 w-3.5" />} label="Fonte de Dados" bordered>
                    Extrato CNIS
                  </StatCell>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal — Nova Simulação */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Simulação de Aposentadoria"
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
          {cnisDocument?.extractedData && (
            <p className="font-sans text-[10px] leading-relaxed text-slate-500">
              O simulador projetará as contribuições futuras a partir de hoje até a data pretendida, mesclando com o histórico acima.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="scenario-name" className="neo-label">
                Nome do Cenário de Simulação
              </label>
              <input
                id="scenario-name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="neo-input"
                placeholder="Ex: Planejamento no Teto até 2030"
              />
            </div>

            <div>
              <label htmlFor="genero-sim" className="neo-label">
                Gênero Jurídico
              </label>
              <select
                id="genero-sim"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="neo-input"
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
              selectClassName="neo-input"
              labelClassName="neo-label"
            />

            <div>
              <label htmlFor="tempo-especial-sim" className="neo-label">
                Tempo Especial Atual (Anos)
              </label>
              <input
                id="tempo-especial-sim"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={tempoEspecialAnos}
                onChange={(e) => setTempoEspecialAnos(Number(e.target.value))}
                className="neo-input"
                placeholder="Ex: 12.5"
              />
            </div>

            <div>
              <label htmlFor="tipo-contribuicao" className="neo-label">
                Valor da Contribuição Futura
              </label>
              <select
                id="tipo-contribuicao"
                value={tipoContribuicao}
                onChange={(e) => setTipoContribuicao(e.target.value as 'MINIMO' | 'TETO' | 'CUSTOM')}
                className="neo-input"
              >
                <option value="MINIMO">
                  Sobre o Salário Mínimo ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salarioVigente.valor)})
                </option>
                <option value="TETO">
                  Sobre o Teto Previdenciário ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salarioVigente.teto)})
                </option>
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

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <Button
              onClick={handleCreate}
              loading={creating}
              className="flex-1 bg-amber-600 font-semibold text-white hover:bg-amber-700"
            >
              Rodar Planejamento
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

      <ConfirmDialog
        open={deleteTargetId !== null}
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId)
          setDeleteTargetId(null)
        }}
        onCancel={() => setDeleteTargetId(null)}
        title="Excluir cenário de simulação?"
        message="Tem certeza que deseja excluir este cenário? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCell({
  icon,
  label,
  children,
  bordered = false,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  bordered?: boolean
}) {
  return (
    <div className={cn(
      'flex flex-col gap-1 px-5 py-4',
      bordered && 'border-l border-slate-100'
    )}>
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="font-sans text-[9px] font-extrabold uppercase tracking-widest">{label}</span>
      </div>
      <span className="font-sans text-sm font-bold text-slate-800">{children}</span>
    </div>
  )
}
