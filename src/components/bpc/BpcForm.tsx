'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import api from '@/lib/api'
import { AlertTriangle, FileDown, Loader2, Calendar, Accessibility, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BpcAnalysis {
  tipoBpc: 'IDOSO' | 'DEFICIENCIA'
  patologia: string | null
  cid: string | null
  idade: number
  faixaEtaria: string
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  barreiras: string | null
  resumoLaudos: string | null
}

export interface BpcSavePayload {
  tipoBpc: 'IDOSO' | 'DEFICIENCIA'
  patologia?: string
  cid?: string
  idade: number
  faixaEtaria: string
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  barreirasRelatadas: string
  resumoLaudos?: string
}

interface BpcFormProps {
  caseId: string
  analysis: BpcAnalysis | null
  clientBirthDate: string | null
  onSave: (data: BpcSavePayload) => void
  saving: boolean
}

const SM_2025 = 1518.00
const LIMITE_PER_CAPITA = SM_2025 / 4

function calcularIdade(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  return m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age
}

export function BpcForm({ caseId, analysis, clientBirthDate, onSave, saving }: BpcFormProps) {
  const suggestedIdade = clientBirthDate && !analysis ? calcularIdade(clientBirthDate) : null

  const [tipoBpc, setTipoBpc] = useState<'IDOSO' | 'DEFICIENCIA'>(analysis?.tipoBpc ?? 'DEFICIENCIA')
  const [patologia, setPatologia] = useState(analysis?.patologia ?? '')
  const [cid, setCid] = useState(analysis?.cid ?? '')
  const [idade, setIdade] = useState(analysis?.idade?.toString() ?? (suggestedIdade?.toString() ?? ''))
  const [rendaFamiliar, setRendaFamiliar] = useState(analysis?.rendaFamiliar?.toString() ?? '')
  const [membrosGrupo, setMembrosGrupo] = useState(analysis?.membrosGrupo?.toString() ?? '')
  const [barreiras, setBarreiras] = useState(analysis?.barreiras ?? '')
  const [resumoLaudos, setResumoLaudos] = useState(analysis?.resumoLaudos ?? '')
  const [importing, setImporting] = useState(false)

  const rendaPerCapita = membrosGrupo && parseFloat(membrosGrupo) > 0
    ? parseFloat(rendaFamiliar || '0') / parseFloat(membrosGrupo)
    : 0

  const faixaEtaria = idade ? (parseInt(idade) < 16 ? 'MENOR_16' : 'MAIOR_16') : ''

  useEffect(() => {
    if (analysis) {
      setTipoBpc(analysis.tipoBpc)
      setPatologia(analysis.patologia ?? '')
      setCid(analysis.cid ?? '')
      setIdade(String(analysis.idade))
      setRendaFamiliar(analysis.rendaFamiliar.toString())
      setMembrosGrupo(analysis.membrosGrupo.toString())
      setBarreiras(analysis.barreiras ?? '')
      setResumoLaudos(analysis.resumoLaudos ?? '')
    } else if (suggestedIdade) {
      setIdade(String(suggestedIdade))
    }
  }, [analysis]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImportarProntuario = async () => {
    setImporting(true)
    try {
      const r = await api.get(`/cases/${caseId}/notes`)
      const notes: Array<{ content: string; createdAt: string }> = r.data.notes ?? []
      if (notes.length === 0) return
      const texto = notes
        .slice(0, 10)
        .map((n) => n.content)
        .join('\n\n---\n\n')
      setBarreiras((prev) => prev ? `${prev}\n\n[Importado do Prontuário]\n${texto}` : texto)
    } catch {
      // noop
    } finally {
      setImporting(false)
    }
  }

  const handleSave = () => {
    if (tipoBpc === 'DEFICIENCIA' && !patologia.trim()) return
    if (idade === '' || rendaFamiliar === '' || membrosGrupo === '') return
    onSave({
      tipoBpc,
      patologia: tipoBpc === 'DEFICIENCIA' ? patologia : undefined,
      cid: tipoBpc === 'DEFICIENCIA' ? (cid || undefined) : undefined,
      idade: parseInt(idade),
      faixaEtaria,
      rendaFamiliar: parseFloat(rendaFamiliar),
      membrosGrupo: parseInt(membrosGrupo),
      rendaPerCapita,
      barreirasRelatadas: barreiras,
      resumoLaudos: tipoBpc === 'DEFICIENCIA' ? (resumoLaudos || undefined) : undefined,
    })
  }

  const isFormValid = (tipoBpc === 'IDOSO' || patologia.trim() !== '') && idade !== '' && rendaFamiliar !== '' && membrosGrupo !== ''
  const idadeAbaixoDoMinimoIdoso = tipoBpc === 'IDOSO' && idade !== '' && parseInt(idade) < 65

  return (
    <Card variant="light" className="p-0 overflow-hidden border-slate-200/80 shadow-sm">
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-sans font-semibold text-sm text-slate-900">Dados do Caso BPC/LOAS</h3>
        {analysis && (
          <Badge variant="green" className="text-[10px] uppercase tracking-wider font-bold">Dados Salvos</Badge>
        )}
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-6">
          {/* Tipo de BPC/LOAS */}
          <div>
            <label className="neo-label">Tipo de BPC/LOAS</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTipoBpc('DEFICIENCIA')}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-xs font-sans font-bold border transition-all flex items-center justify-center gap-2",
                  tipoBpc === 'DEFICIENCIA'
                    ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <Accessibility className="w-3.5 h-3.5 shrink-0" />
                Deficiência
              </button>
              <button
                type="button"
                onClick={() => setTipoBpc('IDOSO')}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-xs font-sans font-bold border transition-all flex items-center justify-center gap-2",
                  tipoBpc === 'IDOSO'
                    ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Idoso (65+)
              </button>
            </div>
          </div>

          {/* Patologia e CID */}
          {tipoBpc === 'DEFICIENCIA' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="neo-label">Patologia</label>
                <input
                  type="text"
                  value={patologia}
                  onChange={(e) => setPatologia(e.target.value)}
                  className={cn(
                    "w-full neo-input font-sans text-sm transition-all focus:border-amber-500 focus:ring-amber-500/20",
                    patologia.trim() ? "border-emerald-250 bg-emerald-50/5 focus:border-emerald-500 focus:ring-emerald-500/10" : "border-slate-200"
                  )}
                  placeholder="Ex: Autismo, TDAH, Esquizofrenia..."
                />
              </div>

              <div>
                <label className="neo-label">CID (opcional)</label>
                <input
                  type="text"
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  className={cn(
                    "w-full neo-input font-sans text-sm transition-all focus:border-amber-500 focus:ring-amber-500/20",
                    cid.trim() ? "border-slate-350 bg-slate-50/30" : "border-slate-200"
                  )}
                  placeholder="Ex: F84.0"
                />
              </div>
            </div>
          )}

          {/* Idade */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="neo-label mb-0">Idade</label>
              {suggestedIdade && !analysis && (
                <span className="text-[10px] font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <Info className="w-3 h-3 text-amber-600" />
                  Calculada do cadastro
                </span>
              )}
            </div>
            <input
              type="number"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              className={cn(
                "w-full neo-input font-sans text-sm transition-all focus:border-amber-500 focus:ring-amber-500/20",
                idade !== ''
                  ? idadeAbaixoDoMinimoIdoso
                    ? "border-red-300 bg-red-50/5 focus:border-red-500 focus:ring-red-500/10"
                    : "border-emerald-250 bg-emerald-50/5 focus:border-emerald-500 focus:ring-emerald-500/10"
                  : "border-slate-200"
              )}
              placeholder="Idade do segurado"
            />
            
            {tipoBpc === 'DEFICIENCIA' && faixaEtaria && (
              <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2.5 mt-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {faixaEtaria === 'MENOR_16'
                    ? 'Menor de 16 anos: a análise da deficiência foca no impacto no desenvolvimento e limitações em relação à idade.'
                    : 'Maior de 16 anos: a análise foca no impedimento de longo prazo para a vida independente e capacidade laboral.'}
                </span>
              </div>
            )}

            {idadeAbaixoDoMinimoIdoso && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50/60 border border-red-200 rounded-md p-3 mt-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Idade insuficiente:</strong> o benefício assistencial para idoso exige a idade mínima de 65 anos.
                </span>
              </div>
            )}
          </div>

          {/* Renda Familiar e Membros */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <CurrencyInput
              value={rendaFamiliar ? parseFloat(rendaFamiliar) : ''}
              onChange={(val) => setRendaFamiliar(String(val))}
              label="Renda Familiar (R$)"
              placeholder="Renda total da família"
              className={cn(
                "transition-all focus:border-amber-500 focus:ring-amber-500/20",
                rendaFamiliar ? "border-emerald-250 bg-emerald-50/5" : "border-slate-200"
              )}
            />

            <div>
              <label className="neo-label">Nº Membros do Grupo Familiar</label>
              <input
                type="number"
                value={membrosGrupo}
                onChange={(e) => setMembrosGrupo(e.target.value)}
                className={cn(
                  "w-full neo-input font-sans text-sm transition-all focus:border-amber-500 focus:ring-amber-500/20",
                  membrosGrupo ? "border-emerald-250 bg-emerald-50/5" : "border-slate-200"
                )}
                placeholder="Quantidade de membros"
              />
            </div>
          </div>

          {/* Card de Análise Socioeconômica */}
          {membrosGrupo && parseFloat(membrosGrupo) > 0 && (
            <div className="bg-slate-50/50 rounded-xl border border-slate-200/80 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">Análise Socioeconômica</span>
                <Badge 
                  variant={rendaPerCapita <= LIMITE_PER_CAPITA ? 'green' : rendaPerCapita <= SM_2025 / 2 ? 'yellow' : 'red'} 
                  className="font-mono text-[9px] uppercase font-extrabold tracking-wider"
                >
                  {rendaPerCapita <= LIMITE_PER_CAPITA ? 'Dentro do Limite' : rendaPerCapita <= SM_2025 / 2 ? 'Vulnerabilidade' : 'Acima do Limite'}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="font-sans text-xs text-slate-550 font-medium">Renda per Capita:</span>
                <div className="text-right">
                  <span className="font-sans font-extrabold text-base text-slate-900">R$ {rendaPerCapita.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">Limite legal: R$ {LIMITE_PER_CAPITA.toFixed(2)} (1/4 SM)</span>
                </div>
              </div>

              {/* Progress bar gauge */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                  {/* Mark the 1/4 SM limit */}
                  <div className="absolute left-[50%] top-0 w-0.5 h-full bg-slate-350 z-10" title="Limite de 1/4 SM" />
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      rendaPerCapita <= LIMITE_PER_CAPITA 
                        ? 'bg-emerald-500' 
                        : rendaPerCapita <= SM_2025 / 2 
                        ? 'bg-amber-500' 
                        : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min((rendaPerCapita / (SM_2025 / 2)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-medium font-mono">
                  <span>R$ 0</span>
                  <span>R$ {LIMITE_PER_CAPITA.toFixed(0)} (1/4)</span>
                  <span>R$ {(SM_2025 / 2).toFixed(0)} (1/2)</span>
                </div>
              </div>

              {/* Legal strategy tips based on renda per capita */}
              <div className="text-xs text-slate-655 leading-relaxed pt-2.5 border-t border-slate-100">
                {rendaPerCapita <= LIMITE_PER_CAPITA ? (
                  <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50/50 border border-emerald-100 rounded-md p-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>O critério de miserabilidade econômica está atendido objetivamente por ser inferior a 1/4 do salário mínimo.</span>
                  </div>
                ) : rendaPerCapita <= SM_2025 / 2 ? (
                  <div className="flex items-start gap-2 text-amber-800 bg-amber-50/50 border border-amber-100 rounded-md p-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Renda acima de 1/4 SM, mas abaixo de 1/2 SM. Judicialmente, é viável comprovar a vulnerabilidade apontando despesas continuadas com saúde, fraldas, remédios e insumos no laudo social.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-red-800 bg-red-50/50 border border-red-150 rounded-md p-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Renda acima do patamar de 1/2 SM. O INSS indeferirá de imediato. Avalie a exclusão legal de membros ou benefícios previdenciários de valor mínimo no mesmo lar.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Barreiras / Composição Familiar */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="neo-label mb-0">
                {tipoBpc === 'IDOSO' ? 'Composição Familiar e Outros Fatores' : 'Barreiras Relatadas'}
              </label>
              <button
                type="button"
                onClick={handleImportarProntuario}
                disabled={importing}
                className="text-[10px] font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{importing ? 'Importando...' : 'Importar Prontuário'}</span>
              </button>
            </div>
            <textarea
              value={barreiras}
              onChange={(e) => setBarreiras(e.target.value)}
              className={cn(
                "w-full neo-input min-h-[120px] resize-none font-sans text-sm focus:ring-amber-500/20 focus:border-amber-500 transition-all",
                barreiras.trim() ? "border-slate-350 bg-slate-50/5" : "border-slate-200"
              )}
              placeholder={
                tipoBpc === 'IDOSO'
                  ? 'Descreva a composição do grupo familiar, outras fontes de renda ou benefícios, dependência de terceiros...'
                  : 'Descreva as barreiras enfrentadas: mobilidade, comunicação, acesso a serviços, preconceito...'
              }
            />
          </div>

          {/* Resumo de Laudos */}
          {tipoBpc === 'DEFICIENCIA' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="neo-label mb-1.5">Resumo dos Laudos (opcional)</label>
              <textarea
                value={resumoLaudos}
                onChange={(e) => setResumoLaudos(e.target.value)}
                className={cn(
                  "w-full neo-input min-h-[120px] resize-none font-sans text-sm focus:ring-amber-500/20 focus:border-amber-500 transition-all",
                  resumoLaudos.trim() ? "border-slate-350 bg-slate-50/5" : "border-slate-200"
                )}
                placeholder="Resumo dos laudos médicos disponíveis, limitações e diagnósticos secundários..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <p className="text-[11px] text-slate-550 font-semibold leading-snug">
          {!isFormValid ? 'Preencha os campos obrigatórios para salvar.' : 'Os dados salvos serão utilizados na análise da IA.'}
        </p>
        <Button onClick={handleSave} loading={saving} disabled={!isFormValid}>
          {analysis ? 'Atualizar Dados' : 'Salvar Dados'}
        </Button>
      </div>
    </Card>
  )
}
