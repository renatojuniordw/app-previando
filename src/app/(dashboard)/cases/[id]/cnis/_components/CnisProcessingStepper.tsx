import { AlertCircle, Loader2 } from 'lucide-react'
import { getStepStatus } from '../_utils'

interface Props {
  processingStatus: string
  stuckWarning: boolean
}

type StepStatus = 'completed' | 'active' | 'waiting'

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'completed') {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
        ✓
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
      </div>
    )
  }
  return null
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
      {n}
    </div>
  )
}

function Step({ n, label, completedText, activeText, status }: {
  n: number; label: string; completedText: string; activeText: string; status: StepStatus
}) {
  return (
    <div className="flex items-center gap-3 flex-1">
      {status === 'waiting' ? <StepNumber n={n} /> : <StepIcon status={status} />}
      <div>
        <p className="font-sans font-bold text-xs text-slate-800">{label}</p>
        <p className="font-sans text-[10px] text-slate-500">
          {status === 'completed' ? completedText : status === 'active' ? activeText : 'Aguardando…'}
        </p>
      </div>
    </div>
  )
}

export function CnisProcessingStepper({ processingStatus, stuckWarning }: Props) {
  const step2 = getStepStatus(2, processingStatus)
  const step3 = getStepStatus(3, processingStatus)

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <h4 className="font-sans font-bold text-xs text-slate-700 tracking-wide uppercase">Progresso de Extração do CNIS</h4>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">✓</div>
            <div>
              <p className="font-sans font-bold text-xs text-slate-800">1. Upload do Arquivo</p>
              <p className="font-sans text-[10px] text-slate-500">Enviado e salvo na nuvem</p>
            </div>
          </div>

          <div className="hidden md:block h-0.5 bg-emerald-250 flex-1 mx-2" />

          <Step n={2} label="2. Identificar Vínculos" completedText="Vínculos identificados" activeText="Extraindo contratos…" status={step2} />

          <div className={`hidden md:block h-0.5 flex-1 mx-2 ${step2 === 'completed' ? 'bg-emerald-250' : 'bg-slate-100'}`} />

          <Step n={3} label="3. Salários Mensais" completedText="Leitura concluída" activeText="Extraindo salários…" status={step3} />
        </div>
      </div>

      {stuckWarning && (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm font-bold text-orange-800">Processamento demorado</p>
            <p className="font-sans text-sm text-orange-700 mt-1">
              O documento está processando há mais de 3 minutos. Certifique-se de que o worker de background (<code>npm run worker</code>) está rodando.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
