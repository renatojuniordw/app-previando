import { HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const SM_2025 = 1518.0
const LIMITE_PER_CAPITA = SM_2025 / 4

interface BpcAnalysisData {
  tipoBpc: 'IDOSO' | 'DEFICIENCIA'
  patologia: string | null
  cid: string | null
  idade: number
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  preAnalise: string | null
  checklist: string | null
}

interface Props {
  analysis: BpcAnalysisData
}

export function PortalBpcSection({ analysis }: Props) {
  const dentroDoLimite = analysis.rendaPerCapita <= LIMITE_PER_CAPITA
  const analiseConcluida = Boolean(analysis.preAnalise && analysis.checklist)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <HeartPulse className="w-4 h-4" aria-hidden="true" />
        <span className="font-sans text-sm font-medium uppercase tracking-wide">
          Análise Socioeconômica (BPC/LOAS)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-sans text-xs text-slate-400">Modalidade</p>
          <p className="font-sans font-semibold text-slate-900">
            {analysis.tipoBpc === 'IDOSO' ? 'BPC Idoso' : 'BPC Pessoa com Deficiência'}
          </p>
        </div>
        <div>
          <p className="font-sans text-xs text-slate-400">Idade</p>
          <p className="font-sans font-semibold text-slate-900">{analysis.idade} anos</p>
        </div>
        {analysis.tipoBpc === 'DEFICIENCIA' && analysis.patologia && (
          <div>
            <p className="font-sans text-xs text-slate-400">Patologia</p>
            <p className="font-sans font-semibold text-slate-900">
              {analysis.patologia}
              {analysis.cid ? ` (CID ${analysis.cid})` : ''}
            </p>
          </div>
        )}
        <div>
          <p className="font-sans text-xs text-slate-400">Membros do Grupo Familiar</p>
          <p className="font-sans font-semibold text-slate-900">{analysis.membrosGrupo}</p>
        </div>
        <div>
          <p className="font-sans text-xs text-slate-400">Renda Familiar</p>
          <p className="font-sans font-semibold text-slate-900">
            {formatCurrency(analysis.rendaFamiliar)}
          </p>
        </div>
        <div>
          <p className="font-sans text-xs text-slate-400">Renda Per Capita</p>
          <p className="font-sans font-semibold text-slate-900">
            {formatCurrency(analysis.rendaPerCapita)}
          </p>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg p-3 ${
          dentroDoLimite ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}
      >
        {dentroDoLimite ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
        )}
        <p className="font-sans text-sm text-slate-700">
          {dentroDoLimite
            ? `Renda per capita dentro do limite legal (${formatCurrency(LIMITE_PER_CAPITA)})`
            : `Renda per capita acima do limite legal (${formatCurrency(LIMITE_PER_CAPITA)})`}
        </p>
      </div>

      <p className="font-sans text-xs text-slate-400">
        Status da análise: {analiseConcluida ? 'Concluída' : 'Em andamento'}
      </p>
    </div>
  )
}
