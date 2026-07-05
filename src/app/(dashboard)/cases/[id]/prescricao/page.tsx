'use client'

import { useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, Info, Calculator, ShieldAlert,
} from 'lucide-react'
import { differenceInDays, addYears, format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const TODAY = new Date()

type Status = 'safe' | 'warning' | 'critical' | 'expired'

interface PrazoResult {
  label: string
  fundamentacao: string
  expiresAt: Date
  daysLeft: number
  status: Status
  totalDays: number
}

function calcStatus(daysLeft: number): Status {
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 30) return 'critical'
  if (daysLeft <= 90) return 'warning'
  return 'safe'
}

function calcPrazos(dataEvento: Date): PrazoResult[] {
  const decadencia = addYears(dataEvento, 10)
  const prescricao = addYears(dataEvento, 5)
  const daysDecadencia = differenceInDays(decadencia, TODAY)
  const daysPrescricao = differenceInDays(prescricao, TODAY)

  return [
    {
      label: 'Decadência',
      fundamentacao: 'Art. 103 da Lei 8.213/91 — prazo de 10 anos para revisão do ato de concessão do benefício.',
      expiresAt: decadencia,
      daysLeft: daysDecadencia,
      status: calcStatus(daysDecadencia),
      totalDays: 3650,
    },
    {
      label: 'Prescrição Quinquenal',
      fundamentacao: 'Art. 103-A da Lei 8.213/91 — prazo de 5 anos para cobrança de diferenças de benefício.',
      expiresAt: prescricao,
      daysLeft: daysPrescricao,
      status: calcStatus(daysPrescricao),
      totalDays: 1825,
    },
  ]
}

const STATUS_CONFIG: Record<Status, {
  icon: typeof CheckCircle2
  color: string
  bgLight: string
  border: string
  label: string
  stripe: string
}> = {
  safe: {
    icon: CheckCircle2,
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Dentro do prazo',
    stripe: 'bg-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Atenção — prazo próximo',
    stripe: 'bg-amber-500',
  },
  critical: {
    icon: ShieldAlert,
    color: 'text-red-700',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    label: 'Crítico — menos de 30 dias',
    stripe: 'bg-red-500',
  },
  expired: {
    icon: XCircle,
    color: 'text-slate-500',
    bgLight: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Prazo expirado',
    stripe: 'bg-slate-300',
  },
}

const TIPOS_EVENTO = [
  { value: 'concessao',     label: 'Data de concessão do benefício' },
  { value: 'indeferimento', label: 'Data do indeferimento administrativo' },
  { value: 'cessacao',      label: 'Data de cessação do benefício' },
  { value: 'obito',         label: 'Data do óbito (pensão por morte)' },
  { value: 'incapacidade',  label: 'Data do início da incapacidade' },
  { value: 'outro',         label: 'Outro evento gerador' },
]

export default function PrescricaoPage() {
  const [dataEvento, setDataEvento] = useState('')
  const [tipoEvento, setTipoEvento] = useState('concessao')

  const parsedDate = dataEvento ? parseISO(dataEvento) : null
  const isValidDate = parsedDate && isValid(parsedDate) && parsedDate <= TODAY
  const prazos = isValidDate ? calcPrazos(parsedDate!) : null
  const tipoLabel = TIPOS_EVENTO.find((t) => t.value === tipoEvento)?.label

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">

      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
          Prescrição e Decadência
        </h1>
        <p className="mt-1 font-sans text-sm text-slate-500">
          Calcule os prazos legais a partir da data do fato gerador do benefício previdenciário.
        </p>
      </div>

      {/* Help Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="font-sans text-xs font-semibold leading-relaxed text-amber-900">
          Informe o tipo e a data do fato gerador para calcular automaticamente os prazos de decadência (10 anos) e prescrição quinquenal (5 anos).
        </p>
      </div>

      {/* Form Panel */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Calculator className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
          </div>
          <h2 className="font-sans text-sm font-extrabold uppercase tracking-wider text-slate-600">
            Dados para cálculo
          </h2>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="tipo-evento" className="neo-label">
                Tipo do fato gerador
              </label>
              <select
                id="tipo-evento"
                value={tipoEvento}
                onChange={(e) => setTipoEvento(e.target.value)}
                className="neo-input"
              >
                {TIPOS_EVENTO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <DatePicker
              label="Data do evento"
              value={dataEvento}
              maxDate={format(TODAY, 'yyyy-MM-dd')}
              onChange={(d) => setDataEvento(d ? d.toISOString().split('T')[0] : '')}
            />
          </div>

          {dataEvento && !isValidDate && (
            <p role="alert" className="flex items-center gap-1.5 font-sans text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Data inválida ou futura. Informe uma data igual ou anterior a hoje.
            </p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!dataEvento && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50">
            <Clock className="h-6 w-6 text-amber-400" aria-hidden="true" />
          </div>
          <p className="font-sans text-sm text-slate-400">
            Informe a data do fato gerador para calcular os prazos
          </p>
        </div>
      )}

      {/* Results */}
      {prazos && (
        <div className="animate-fade-in space-y-5">
          {/* Context label */}
          <div className="flex items-center gap-1.5 font-sans text-xs text-slate-500">
            <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>
              Calculado a partir de:{' '}
              <strong className="text-slate-700">
                {format(parsedDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </strong>
              {tipoLabel && <> — <span className="text-slate-600">{tipoLabel}</span></>}
            </span>
          </div>

          {/* Prazo Cards */}
          {prazos.map((prazo) => {
            const cfg = STATUS_CONFIG[prazo.status]
            const Icon = cfg.icon
            const progressPct = Math.min(100, Math.max(2, (prazo.daysLeft / prazo.totalDays) * 100))

            return (
              <div
                key={prazo.label}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300',
                  cfg.border,
                  (prazo.status === 'critical' || prazo.status === 'expired') && 'shadow-md'
                )}
              >
                {/* Status stripe */}
                <div className={cn('h-1 w-full', cfg.stripe)} />

                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: label + fundamentação */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl border',
                        cfg.bgLight, cfg.border
                      )}>
                        <Icon className={cn('h-4 w-4', cfg.color)} aria-hidden="true" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-slate-900">{prazo.label}</h3>
                      <span className={cn(
                        'rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
                        cfg.bgLight, cfg.color, cfg.border
                      )}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="font-sans text-xs leading-relaxed text-slate-500">
                      {prazo.fundamentacao}
                    </p>
                  </div>

                  {/* Right: countdown */}
                  <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                    <div className="text-right">
                      <p className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Vencimento
                      </p>
                      <p className="font-mono font-bold text-slate-800">
                        {format(prazo.expiresAt, 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className={cn('rounded-xl px-4 py-2.5 text-center', cfg.bgLight)}>
                      <p className={cn('font-mono text-2xl font-black', cfg.color)}>
                        {Math.abs(prazo.daysLeft)}
                      </p>
                      <p className="font-sans text-[10px] font-semibold text-slate-500">
                        {prazo.daysLeft >= 0 ? 'dias restantes' : 'dias expirados'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {prazo.status !== 'expired' && (
                  <div className="px-6 pb-5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', cfg.stripe)}
                        style={{ width: `${progressPct}%` }}
                        role="progressbar"
                        aria-valuenow={Math.round(progressPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${Math.round(progressPct)}% do prazo restante`}
                      />
                    </div>
                    <p className="mt-1 text-right font-sans text-[10px] text-slate-400">
                      {Math.round(progressPct)}% do prazo restante
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Legal Disclaimer */}
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <p className="font-sans text-xs leading-relaxed text-amber-800">
              <strong>Atenção:</strong> Os prazos podem ser suspensos ou interrompidos por causas legais (ex.: incapacidade civil, requerimento administrativo, ação judicial). Verifique sempre o caso concreto antes de concluir pelo decurso do prazo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
