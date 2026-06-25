'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface BpcAnalysis {
  patologia: string
  cid: string | null
  idade: number
  faixaEtaria: string
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  barreiras: string | null
  resumoLaudos: string | null
}

interface BpcSavePayload {
  patologia: string
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
  analysis: BpcAnalysis | null
  onSave: (data: BpcSavePayload) => void
  saving: boolean
}

const SM_2025 = 1518.00
const LIMITE_PER_CAPITA = SM_2025 / 4

export function BpcForm({ analysis, onSave, saving }: BpcFormProps) {
  const [patologia, setPatologia] = useState(analysis?.patologia ?? '')
  const [cid, setCid] = useState(analysis?.cid ?? '')
  const [idade, setIdade] = useState(analysis?.idade?.toString() ?? '')
  const [rendaFamiliar, setRendaFamiliar] = useState(analysis?.rendaFamiliar?.toString() ?? '')
  const [membrosGrupo, setMembrosGrupo] = useState(analysis?.membrosGrupo?.toString() ?? '')
  const [barreiras, setBarreiras] = useState(analysis?.barreiras ?? '')
  const [resumoLaudos, setResumoLaudos] = useState(analysis?.resumoLaudos ?? '')

  const rendaPerCapita = membrosGrupo && parseFloat(membrosGrupo) > 0
    ? parseFloat(rendaFamiliar || '0') / parseFloat(membrosGrupo)
    : 0

  const faixaEtaria = idade ? (parseInt(idade) < 16 ? 'MENOR_16' : 'MAIOR_16') : ''
  const acimaDoLimite = rendaPerCapita > LIMITE_PER_CAPITA

  useEffect(() => {
    if (analysis) {
      setPatologia(analysis.patologia)
      setCid(analysis.cid ?? '')
      setIdade(String(analysis.idade))
      setRendaFamiliar(analysis.rendaFamiliar.toString())
      setMembrosGrupo(analysis.membrosGrupo.toString())
      setBarreiras(analysis.barreiras ?? '')
      setResumoLaudos(analysis.resumoLaudos ?? '')
    }
  }, [analysis])

  const handleSave = () => {
    if (!patologia || !idade || !rendaFamiliar || !membrosGrupo) return
    onSave({
      patologia,
      cid: cid || undefined,
      idade: parseInt(idade),
      faixaEtaria,
      rendaFamiliar: parseFloat(rendaFamiliar),
      membrosGrupo: parseInt(membrosGrupo),
      rendaPerCapita,
      barreirasRelatadas: barreiras,
      resumoLaudos: resumoLaudos || undefined,
    })
  }

  return (
    <Card variant="light" className="p-6">
      <h3 className="font-sans font-semibold text-sm text-slate-900 mb-4">Dados do Caso BPC/LOAS</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label className="neo-label">Idade</label>
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
        </div>

        <div className="md:col-span-1" />

        <div>
          <label className="neo-label">Renda Familiar (R$)</label>
          <input
            type="number"
            step="0.01"
            value={rendaFamiliar}
            onChange={(e) => setRendaFamiliar(e.target.value)}
            className="w-full neo-input font-sans text-sm"
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
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-slate-500">Renda per capita:</span>
              <Badge variant={acimaDoLimite ? 'red' : 'green'}>
                R$ {rendaPerCapita.toFixed(2)} — {acimaDoLimite ? 'ACIMA DO LIMITE LEGAL' : 'DENTRO DO LIMITE'}
              </Badge>
            </div>
            {acimaDoLimite && (
              <p className="font-sans text-xs text-amber-600 mt-1">
                Limite legal: R$ {LIMITE_PER_CAPITA.toFixed(2)} (1/4 SM). Verifique possibilidade de exclusão de membros ou critérios de miserabilidade.
              </p>
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="neo-label">Barreiras Relatadas</label>
          <textarea
            value={barreiras}
            onChange={(e) => setBarreiras(e.target.value)}
            className="w-full neo-input min-h-[80px] resize-none font-sans text-sm"
            placeholder="Descreva as barreiras enfrentadas: mobilidade, comunicação, acesso a serviços, preconceito..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="neo-label">Resumo dos Laudos (opcional)</label>
          <textarea
            value={resumoLaudos}
            onChange={(e) => setResumoLaudos(e.target.value)}
            className="w-full neo-input min-h-[80px] resize-none font-sans text-sm"
            placeholder="Resumo dos laudos médicos disponíveis..."
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={!patologia || !idade || !rendaFamiliar || !membrosGrupo}>
          Salvar Dados
        </Button>
      </div>
    </Card>
  )
}
