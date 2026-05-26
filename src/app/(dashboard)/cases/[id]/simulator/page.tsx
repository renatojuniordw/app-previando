'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { MODALIDADES_PADRAO } from '@/lib/modalidade-labels'
import {
  TrendingUp,
  Scale,
  Calendar,
  User,
  ShieldAlert,
  Loader2,
  Trash2,
  DollarSign,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react'

interface Simulation {
  id: string
  scenarioName: string
  scenarioParams: any
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

const formatCurrency = (val: string | number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val))
}

export default function SimulatorPage() {
  const params = useParams()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [cnisDocument, setCnisDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Parâmetros do Modal Visual de Projeção
  const [scenarioName, setScenarioName] = useState('')
  const [modalidade, setModalidade] = useState('APOSENTADORIA_IDADE')
  const [gender, setGender] = useState<'M' | 'F'>('F')
  const [dibProjetada, setDibProjetada] = useState('2030-01-01')
  
  // Valor padrão de contribuição futura (ex: Salário Mínimo ou customizado)
  const [tipoContribuicao, setTipoContribuicao] = useState<'MINIMO' | 'TETO' | 'CUSTOM'>('MINIMO')
  const [valorCustomContribuicao, setValorCustomContribuicao] = useState(1621.00)
  const [salarioVigente, setSalarioVigente] = useState({ valor: 1621.00, teto: 8157.41 })
  const [regrasVigentes, setRegrasVigentes] = useState<Record<string, any>>({})
  
  const [errorMessage, setErrorMessage] = useState('')

  const load = async () => {
    try {
      const [rSim, rCnis, rModalidades] = await Promise.all([
        api.get(`/cases/${params.id}/simulations`),
        api.get(`/cnis/${params.id}`),
        api.get('/modalidades'),
      ])
      setSimulations(rSim.data.simulations ?? [])
      setModalidades(rModalidades.data.modalidades ?? [])

      if (rCnis.data?.cnisDocument?.processingStatus === 'COMPLETED') {
        setCnisDocument(rCnis.data.cnisDocument)
      }

      // 3. Busca salário mínimo, teto e regras previdenciárias vigentes hoje
      const hoje = new Date().toISOString().slice(0, 10)
      const [rSalario, rRegras] = await Promise.all([
        api.get(`/salario-minimo?dib=${hoje}`),
        api.get(`/regras-aposentadoria?dib=${hoje}`),
      ])
      setSalarioVigente({ valor: rSalario.data.valor, teto: rSalario.data.teto })
      setValorCustomContribuicao(rSalario.data.valor)
      setRegrasVigentes(rRegras.data)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [params.id])

  const modalidadeLabels = Object.fromEntries(
    (modalidades.length > 0 ? modalidades : MODALIDADES_PADRAO).map(({ codigo, label }) => [codigo, label])
  )

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
      // Envia apenas os parâmetros brutos do cenário para o servidor calcular com segurança
      await api.post(`/cases/${params.id}/simulations`, {
        scenarioName,
        gender,
        dibProjetada,
        valorContribuicaoFutura,
        modalidade,
      })

      setShowModal(false)
      // Reseta form
      setScenarioName('')
      setTipoContribuicao('MINIMO')
      setValorCustomContribuicao(salarioVigente.valor)
      load()
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error ?? 'Falha ao salvar a simulação no servidor.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (simId: string) => {
    try {
      await api.delete(`/cases/${params.id}/simulations/${simId}`)
      load()
    } catch {
      // noop
    }
  }

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
          <Compass className="w-4 h-4" />
          Nova Simulação
        </Button>
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
                alert('Por favor, primeiro envie e processe o documento CNIS deste caso.')
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
            const paramsSim = sim.scenarioParams as any
            const gain = Number(sim.gainVsNow)

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
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Cenário
                  </button>
                </div>

                {/* Grid Visual de Comparação */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <span className="font-bold text-slate-800 text-sm mt-0.5">Planejada e simulada</span>
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

          {cnisDocument && cnisDocument.extractedData && (
            <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-4 space-y-3">
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-amber-700 flex items-center gap-1 font-semibold">
                <User className="w-3.5 h-3.5" />
                Segurado Vinculado (CNIS)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans text-slate-700">
                <div className="sm:col-span-3 pb-1.5 border-b border-amber-100/50">
                  <span className="font-bold text-slate-800 text-sm">{cnisDocument.extractedData.nome ?? 'Não informado'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">NIT</span>
                  <span className="text-slate-800 font-medium">{cnisDocument.extractedData.nit ?? 'Não informado'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Nascimento</span>
                  <span className="text-slate-800 font-medium">{formatDate(cnisDocument.extractedData.dataNascimento) ?? 'Não informado'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Total Vínculos</span>
                  <span className="text-slate-800 font-medium">{cnisDocument.extractedData.periodos?.length ?? 0}</span>
                </div>
              </div>
              <p className="font-sans text-[10px] text-slate-500 leading-relaxed pt-1.5 border-t border-amber-100/30">
                O simulador projetará as contribuições futuras a partir de hoje até a data pretendida, mesclando com o histórico acima.
              </p>
            </div>
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
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Data Pretendida de Aposentadoria</label>
              <input
                type="date"
                value={dibProjetada}
                onChange={(e) => setDibProjetada(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Regra de Aposentadoria</label>
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

            <div>
              <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Valor da Contribuição Futura</label>
              <select
                value={tipoContribuicao}
                onChange={(e: any) => setTipoContribuicao(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              >
                <option value="MINIMO">Sobre o Salário Mínimo ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salarioVigente.valor)})</option>
                <option value="TETO">Sobre o Teto Previdenciário ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salarioVigente.teto)})</option>
                <option value="CUSTOM">Outro Valor Customizado em R$</option>
              </select>
            </div>

            {tipoContribuicao === 'CUSTOM' && (
              <div className="animate-slide-down">
                <label className="font-sans font-bold text-xs text-slate-600 block mb-1">Salário de Contribuição Mensal Planejado (BRL)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
                    R$
                  </div>
                  <input
                    type="number"
                    min={String(salarioVigente.valor)}
                    max="10000"
                    value={valorCustomContribuicao}
                    onChange={(e) => setValorCustomContribuicao(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                    placeholder="Ex: 3000"
                  />
                </div>
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
