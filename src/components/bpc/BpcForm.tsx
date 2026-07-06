'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import api from '@/lib/api'

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
  const acimaDoLimite = rendaPerCapita > LIMITE_PER_CAPITA

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
    <Card variant="light" className="p-0 overflow-hidden">
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-sans font-semibold text-sm text-slate-900">Dados do Caso BPC/LOAS</h3>
        {analysis && (
          <Badge variant="green" className="text-[10px] uppercase tracking-wider">Dados Salvos</Badge>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="neo-label">Tipo de BPC/LOAS</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipoBpc('DEFICIENCIA')}
                className={`flex-1 px-4 py-2 rounded-md text-xs font-sans font-semibold border transition-colors ${
                  tipoBpc === 'DEFICIENCIA'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Deficiência
              </button>
              <button
                type="button"
                onClick={() => setTipoBpc('IDOSO')}
                className={`flex-1 px-4 py-2 rounded-md text-xs font-sans font-semibold border transition-colors ${
                  tipoBpc === 'IDOSO'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Idoso (65+)
              </button>
            </div>
          </div>

          {tipoBpc === 'DEFICIENCIA' && (
            <div>
              <label className="neo-label">Patologia</label>
              <input
                type="text"
                value={patologia}
                onChange={(e) => setPatologia(e.target.value)}
                className="w-full neo-input font-sans text-sm"
                placeholder="Ex: Autismo, TDAH, Esquizofrenia..."
              />
            </div>
          )}

          {tipoBpc === 'DEFICIENCIA' && (
            <div>
              <label className="neo-label">CID (opcional)</label>
              <input
                type="text"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                className="w-full neo-input font-sans text-sm"
                placeholder="Ex: F84.0"
              />
            </div>
          )}

          <div>
            <label className="neo-label flex items-center gap-2">
              Idade
              {suggestedIdade && !analysis && (
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  calculada do cadastro
                </span>
              )}
            </label>
            <input
              type="number"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              className="w-full neo-input font-sans text-sm"
              placeholder="Idade do segurado"
            />
            {faixaEtaria && (
              <span className="font-sans text-xs text-slate-500 mt-1 block">
                {faixaEtaria === 'MENOR_16' ? 'Menor de 16 anos' : 'Maior de 16 anos'}
              </span>
            )}
            {idadeAbaixoDoMinimoIdoso && (
              <Badge variant="red" className="font-mono mt-1.5">
                Idade abaixo de 65 anos — BPC-idoso exige 65 anos ou mais.
              </Badge>
            )}
          </div>

          <div className="md:col-span-1 hidden md:block" />

          <div>
            <CurrencyInput
              value={rendaFamiliar ? parseFloat(rendaFamiliar) : ''}
              onChange={(val) => setRendaFamiliar(String(val))}
              label="Renda Familiar (R$)"
              placeholder="Renda total da família"
            />
          </div>

          <div>
            <label className="neo-label">Nº Membros do Grupo Familiar</label>
            <input
              type="number"
              value={membrosGrupo}
              onChange={(e) => setMembrosGrupo(e.target.value)}
              className="w-full neo-input font-sans text-sm"
              placeholder="Quantidade de membros"
            />
          </div>

          {membrosGrupo && parseFloat(membrosGrupo) > 0 && (
            <div className="md:col-span-2 p-3 bg-slate-50 rounded-md border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs font-medium text-slate-600">Renda per capita:</span>
                <Badge variant={acimaDoLimite ? 'red' : 'green'} className="font-mono">
                  R$ {rendaPerCapita.toFixed(2)} — {acimaDoLimite ? 'ACIMA DO LIMITE LEGAL' : 'DENTRO DO LIMITE'}
                </Badge>
              </div>
              {acimaDoLimite && (
                <p className="font-sans text-xs text-red-600 mt-1.5 flex items-start gap-1">
                  <span className="mt-0.5">⚠️</span> 
                  <span>
                    Limite legal: R$ {LIMITE_PER_CAPITA.toFixed(2)} (1/4 SM). Verifique possibilidade de exclusão de membros ou critérios de miserabilidade no laudo social.
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="md:col-span-2 mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="neo-label mb-0">
                {tipoBpc === 'IDOSO' ? 'Composição Familiar e Outros Fatores' : 'Barreiras Relatadas'}
              </label>
              <button
                type="button"
                onClick={handleImportarProntuario}
                disabled={importing}
                className="text-xs font-sans font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2 disabled:opacity-50 flex items-center gap-1"
              >
                {importing ? '⏳ Importando...' : '📥 Importar do Prontuário'}
              </button>
            </div>
            <textarea
              value={barreiras}
              onChange={(e) => setBarreiras(e.target.value)}
              className="w-full neo-input min-h-[100px] resize-none font-sans text-sm"
              placeholder={
                tipoBpc === 'IDOSO'
                  ? 'Descreva a composição do grupo familiar, outras fontes de renda ou benefícios, dependência de terceiros...'
                  : 'Descreva as barreiras enfrentadas: mobilidade, comunicação, acesso a serviços, preconceito...'
              }
            />
          </div>

          {tipoBpc === 'DEFICIENCIA' && (
            <div className="md:col-span-2">
              <label className="neo-label mb-1.5">Resumo dos Laudos (opcional)</label>
              <textarea
                value={resumoLaudos}
                onChange={(e) => setResumoLaudos(e.target.value)}
                className="w-full neo-input min-h-[100px] resize-none font-sans text-sm"
                placeholder="Resumo dos laudos médicos disponíveis, limitações e diagnósticos secundários..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">
          {!isFormValid ? 'Preencha os campos obrigatórios para salvar.' : 'Os dados salvos serão utilizados na análise da IA.'}
        </p>
        <Button onClick={handleSave} loading={saving} disabled={!isFormValid}>
          {analysis ? 'Atualizar Dados' : 'Salvar Dados'}
        </Button>
      </div>
    </Card>
  )
}
