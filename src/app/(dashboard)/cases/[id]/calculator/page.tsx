'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DatePicker } from '@/components/ui/DatePicker'
import { ActionsDropdown } from '@/components/ui/ActionsDropdown'
import { formatCurrency, formatDate, formatPercentage, cn } from '@/lib/utils'
import { getModalityLabel } from '@/lib/modalidade-labels'
import { ModalitySelect } from '@/components/case/ModalitySelect'
import { CnisInfoCard } from '@/components/cases/CnisInfoCard'
import { useToast } from '@/store/toast'
import { useCalculator } from './_hooks/useCalculator'
import { CauseValueSection } from './_components/CauseValueSection'
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
  CheckCircle2,
  Star,
  TrendingUp,
  Percent,
  Clock,
  AlertTriangle,
} from 'lucide-react'

export default function CalculatorPage() {
  const { addToast } = useToast()
  const {
    calculations,
    cnisDocument,
    loading,
    creating,
    showModal,
    setShowModal,
    errorMessage,
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
    disabilityDegree,
    setDisabilityDegree,
    converterTempoComumPCD,
    setConverterTempoComumPCD,
    caseBenefitType,
    handleCreate,
    handleSelect,
    handleDelete,
    confirmDelete,
  } = useCalculator()

  const [expandedCalc, setExpandedCalc] = useState<string | null>(null)

  // BPC/LOAS é benefício assistencial e não depende de tempo de contribuição, logo dispensa o CNIS.
  const requiresCnis = caseBenefitType !== 'BPC_LOAS'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="mt-4 font-sans text-sm font-medium text-slate-500 animate-pulse">
          Carregando painel de cálculos...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
            Painel de Cálculos
          </h1>
          <p className="mt-1 font-sans text-sm text-slate-500">
            Calcule o RMI e analise elegibilidade previdenciária com base no CNIS do segurado.
          </p>
        </div>
        {calculations.length > 0 && (
          <Button
            onClick={() => {
              if (requiresCnis && !cnisDocument) {
                addToast({ type: 'error', title: 'CNIS necessário', message: 'Faça upload do CNIS para realizar os cálculos.' })
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

      {/* Help Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3.5">
        <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="font-sans text-xs font-semibold text-amber-900 leading-relaxed">
          Selecione a modalidade de aposentadoria e preencha os parâmetros para calcular o valor do benefício (RMI).
          Use a aba <strong>Comparar</strong> para visualizar modalidades lado a lado antes de decidir.
        </p>
      </div>

      {/* Valor da Causa (exclusivo de BPC/LOAS) */}
      {caseBenefitType === 'BPC_LOAS' && <CauseValueSection />}

      {/* Empty State */}
      {calculations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-250 bg-white py-20 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 shadow-xs">
            <Scale className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mb-2 font-serif text-lg font-bold text-slate-900">
            Nenhum Cálculo Realizado
          </h2>
          <p className="mx-auto mb-7 max-w-sm font-sans text-sm text-slate-500 leading-relaxed">
            Gere relatórios completos de RMI, RMA e elegibilidade jurídica para o segurado de forma visual e precisa.
          </p>
          <Button
            onClick={() => {
              if (requiresCnis && !cnisDocument) {
                addToast({ type: 'error', title: 'CNIS necessário', message: 'Faça upload do CNIS para realizar os cálculos.' })
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
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300',
                  calc.isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-100/50 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                )}
              >
                {/* Selected stripe */}
                {calc.isSelected && (
                  <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                )}

                {/* Card Header */}
                <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-lg font-bold tracking-tight text-slate-900">
                        {getModalityLabel(calc.modality)}
                      </h2>
                      {calc.isSelected && (
                        <span className="flex items-center gap-1 shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                          Selecionado p/ Relatório
                        </span>
                      )}
                      {isCalcElegivel ? (
                        <span className="flex items-center gap-1 shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                          <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
                          Elegível
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 shrink-0 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
                          <ShieldAlert className="h-2.5 w-2.5" aria-hidden="true" />
                          Pendências
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        DIB: <span className="font-mono">{formatDate(calc.expectedDib || calc.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {parsedInput?.gender === 'M' ? 'Masculino' : 'Feminino'}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCalc(isExpanded ? null : calc.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-sans text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Recolher detalhes do cálculo' : 'Ver detalhes do cálculo'}
                    >
                      {isExpanded ? (
                        <><ChevronUp className="h-3.5 w-3.5" /> Recolher</>
                      ) : (
                        <><ChevronDown className="h-3.5 w-3.5" /> Detalhes</>
                      )}
                    </button>

                    <ActionsDropdown
                      ariaLabel="Ações do cálculo"
                      actions={[
                        ...(!calc.isSelected ? [{
                          label: 'Selecionar para relatório',
                          icon: <Star className="w-4 h-4" />,
                          onClick: () => handleSelect(calc.id),
                        }] : []),
                        {
                          label: 'Excluir cálculo',
                          icon: <Trash2 className="w-4 h-4" />,
                          onClick: () => handleDelete(calc.id),
                          variant: 'danger' as const,
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 gap-0 border-t border-slate-100 sm:grid-cols-3">
                  <KpiCell
                    label="RMI (Renda Mensal Inicial)"
                    value={formatCurrency(calc.rmi)}
                    icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
                    highlight
                    border="right"
                  />
                  <KpiCell
                    label="Salário de Benefício"
                    value={formatCurrency(calc.benefitSalary)}
                    icon={<Scale className="h-4 w-4 text-slate-400" />}
                    border="right"
                  />
                  <KpiCell
                    label="Coeficiente / Alíquota"
                    value={calc.coefficient != null ? formatPercentage(Number(calc.coefficient) * 100) : '—'}
                    icon={<Percent className="h-4 w-4 text-slate-400" />}
                  />
                </div>

                {/* Expanded: Pending Issues + Details */}
                {isExpanded && (
                  <div className="animate-fade-in space-y-5 border-t border-slate-100 bg-slate-50/30 p-6">

                    {/* Pending Issues */}
                    {!isCalcElegivel && calc.pendingIssues && calc.pendingIssues.length > 0 && (
                      <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-white">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                          </div>
                          <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-rose-700">
                            Requisitos pendentes para concessão
                          </span>
                        </div>
                        <ul className="space-y-1.5 pl-2">
                          {calc.pendingIssues.map((pend, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2 font-sans text-sm text-rose-800">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden="true" />
                              {pend}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Data Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <DataCell label="Tempo de Contribuição" icon={<Clock className="h-3 w-3" />}>
                        {calc.contributionTime ? `${(calc.contributionTime / 12).toFixed(1)} anos` : '—'}
                      </DataCell>
                      <DataCell label="Carência" icon={<CheckCircle2 className="h-3 w-3" />}>
                        <span className={cn('font-bold', calc.gracePeriodMet ? 'text-emerald-700' : 'text-rose-700')}>
                          {calc.gracePeriodMet ? 'Atendida' : 'Não Atendida'}
                        </span>
                      </DataCell>
                      <DataCell label="Idade na Apuração" icon={<User className="h-3 w-3" />}>
                        {calc.ageAtCalculation != null ? `${calc.ageAtCalculation} anos` : '—'}
                      </DataCell>
                      <DataCell label="Criado em" icon={<Calendar className="h-3 w-3" />}>
                        <span className="font-mono">{formatDate(calc.createdAt)}</span>
                      </DataCell>
                    </div>

                    {/* Calculation Memory */}
                    {calc.calculationMemory && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                          </div>
                          <span className="font-sans text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            Memória de Cálculo — Detalhamento da Média
                          </span>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          {/* Memory Header */}
                          <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-50 sm:grid-cols-4">
                            {[
                              { label: 'Competências', value: `${calc.calculationMemory.contribuicoesConsideradas ?? '—'}` },
                              { label: 'Gênero', value: calc.calculationMemory.genero ?? '—' },
                              { label: 'Piso Nacional', value: calc.calculationMemory.pisoNacional ? formatCurrency(calc.calculationMemory.pisoNacional) : '—' },
                              { label: 'Teto Previdenciário', value: calc.calculationMemory.tetoPrevidenciario ? formatCurrency(calc.calculationMemory.tetoPrevidenciario) : '—' },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
                                <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
                                <span className="font-mono text-sm font-bold text-slate-800">{value}</span>
                              </div>
                            ))}
                          </div>

                          {/* PCD — via de elegibilidade e conversão de tempo comum */}
                          {calc.calculationMemory.viaElegibilidade && (
                            <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-50 sm:grid-cols-3">
                              {[
                                {
                                  label: 'Via de Elegibilidade',
                                  value: calc.calculationMemory.viaElegibilidade === 'AMBAS'
                                    ? 'Idade e Tempo de Contribuição'
                                    : calc.calculationMemory.viaElegibilidade === 'IDADE'
                                      ? 'Idade (60H / 55M + 15 anos)'
                                      : 'Tempo de Contribuição (por grau)',
                                },
                                ...(calc.calculationMemory.converterTempoComumPCD
                                  ? [
                                      { label: 'Tempo Comum Apurado', value: `${calc.calculationMemory.tempoContribuicaoRawAnos ?? '—'} anos` },
                                      { label: 'Tempo Convertido (PCD)', value: `${calc.calculationMemory.tempoContribuicaoConvertidoAnos ?? '—'} anos` },
                                    ]
                                  : []),
                              ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
                                  <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
                                  <span className="font-mono text-sm font-bold text-slate-800">{value}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Salary Table */}
                          {calc.calculationMemory.detalhamentoMedia && calc.calculationMemory.detalhamentoMedia.length > 0 && (
                            <div className="p-4 space-y-2">
                              <span className="block font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Primeiras competências utilizadas
                              </span>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                                {calc.calculationMemory.detalhamentoMedia.map((sal, sIdx) => {
                                  const parts = sal.competencia.split('-')
                                  const compFormat = parts.length === 2 ? `${parts[1]}/${parts[0]}` : sal.competencia
                                  return (
                                    <div
                                      key={sIdx}
                                      className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 hover:border-slate-200 transition-colors"
                                    >
                                      <span className="font-mono text-[10px] font-bold text-slate-400">{compFormat}</span>
                                      <span className="mt-1 font-mono text-xs font-bold text-slate-800">{formatCurrency(sal.valorAjustado)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                              <p className="font-sans text-[10px] italic text-slate-400">
                                * Exibindo as primeiras competências do período de cálculo para verificação do piso/teto.
                              </p>
                            </div>
                          )}
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

      {/* Modal — Novo Cálculo */}
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

            {modalidade === 'APOSENTADORIA_PCD' && (
              <div className="animate-fade-in">
                <label htmlFor="grau-deficiencia" className="neo-label">
                  Grau de deficiência (LC 142/2013)
                </label>
                <select
                  id="grau-deficiencia"
                  value={disabilityDegree}
                  onChange={(e) => setDisabilityDegree(e.target.value as 'LEVE' | 'MODERADO' | 'GRAVE' | '')}
                  className="neo-input"
                  aria-describedby="grau-deficiencia-hint"
                >
                  <option value="">Selecione o grau...</option>
                  <option value="GRAVE">Grave (25 anos H / 20 anos M)</option>
                  <option value="MODERADO">Moderado (29 anos H / 24 anos M)</option>
                  <option value="LEVE">Leve (33 anos H / 28 anos M)</option>
                </select>
                <p id="grau-deficiencia-hint" className="mt-1 font-sans text-[10px] text-slate-400">
                  Também é elegível quem atingir 60 anos (H) / 55 anos (M) com 15 anos de contribuição, independente do grau.
                </p>

                {disabilityDegree && (
                  <label className="mt-3 flex items-start gap-2 font-sans text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={converterTempoComumPCD}
                      onChange={(e) => setConverterTempoComumPCD(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Converter todo o tempo de contribuição comum em tempo equivalente PCD (proporcional ao grau, LC 142/2013), mesmo que a deficiência tenha surgido após o início da atividade.
                    </span>
                  </label>
                )}
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

          <div className="flex gap-3 border-t border-slate-100 pt-4">
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
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Excluir cálculo?"
        message="Tem certeza que deseja excluir este cálculo? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCell({
  label,
  value,
  icon,
  highlight = false,
  border,
}: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
  border?: 'right'
}) {
  return (
    <div className={cn(
      'flex flex-col justify-between gap-1 p-5',
      highlight && 'bg-amber-50/30',
      border === 'right' && 'border-b border-slate-100 sm:border-b-0 sm:border-r'
    )}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <span className={cn(
        'font-mono text-xl font-bold tracking-tight',
        highlight ? 'text-amber-700' : 'text-slate-900'
      )}>
        {value}
      </span>
    </div>
  )
}

function DataCell({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-sans text-sm font-bold text-slate-800">{children}</div>
    </div>
  )
}
