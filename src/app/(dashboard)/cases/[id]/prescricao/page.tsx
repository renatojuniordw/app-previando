'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { DatePicker } from '@/components/ui/DatePicker'
import { AlertTriangle, CheckCircle2, XCircle, Clock, Info, Calculator } from 'lucide-react'
import { differenceInDays, addYears, format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TODAY = new Date()

type Status = 'safe' | 'warning' | 'critical' | 'expired'

interface PrazoResult {
  label: string
  fundamentacao: string
  expiresAt: Date
  daysLeft: number
  status: Status
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
      fundamentacao: 'Art. 103 da Lei 8.213/91 — prazo de 10 anos para revisão do ato de concessão do benefício',
      expiresAt: decadencia,
      daysLeft: daysDecadencia,
      status: calcStatus(daysDecadencia),
    },
    {
      label: 'Prescrição Quinquenal',
      fundamentacao: 'Art. 103-A da Lei 8.213/91 — prazo de 5 anos para cobrança de diferenças de benefício',
      expiresAt: prescricao,
      daysLeft: daysPrescricao,
      status: calcStatus(daysPrescricao),
    },
  ]
}

const STATUS_CONFIG: Record<Status, { icon: typeof CheckCircle2; color: string; bg: string; border: string; label: string }> = {
  safe: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Dentro do prazo',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Atenção — prazo próximo',
  },
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Crítico — menos de 30 dias',
  },
  expired: {
    icon: XCircle,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Prazo expirado',
  },
}

export default function PrescricaoPage() {
  const [dataEvento, setDataEvento] = useState('')
  const [tipoEvento, setTipoEvento] = useState('concessao')

  const parsedDate = dataEvento ? parseISO(dataEvento) : null
  const isValidDate = parsedDate && isValid(parsedDate) && parsedDate <= TODAY
  const prazos = isValidDate ? calcPrazos(parsedDate!) : null

  const TIPOS_EVENTO = [
    { value: 'concessao', label: 'Data de concessão do benefício' },
    { value: 'indeferimento', label: 'Data do indeferimento administrativo' },
    { value: 'cessacao', label: 'Data de cessação do benefício' },
    { value: 'obito', label: 'Data do óbito (pensão por morte)' },
    { value: 'incapacidade', label: 'Data do início da incapacidade' },
    { value: 'outro', label: 'Outro evento gerador' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="font-serif font-bold text-2xl text-slate-900">Prescrição e Decadência</h2>
        <p className="text-sm text-slate-500 mt-1">
          Calcule os prazos legais a partir da data do fato gerador do benefício
        </p>
      </div>

      {/* Formulário */}
      <Card variant="light" className="p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-600 mb-1">
          <Calculator className="w-4 h-4" />
          <span className="font-sans text-sm font-semibold uppercase tracking-wide">Dados para cálculo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="font-sans text-sm font-medium text-slate-700">
              Tipo do fato gerador
            </label>
            <select
              value={tipoEvento}
              onChange={(e) => setTipoEvento(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {TIPOS_EVENTO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <DatePicker
              label="Data do evento"
              value={dataEvento}
              maxDate={format(TODAY, 'yyyy-MM-dd')}
              onChange={(d) => setDataEvento(d ? d.toISOString().split('T')[0] : '')}
            />
          </div>
        </div>

        {dataEvento && !isValidDate && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Data inválida ou futura.
          </p>
        )}
      </Card>

      {/* Resultados */}
      {prazos && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Calculado a partir de:{' '}
            <strong className="text-slate-600">
              {format(parsedDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </strong>
            {' '}— {TIPOS_EVENTO.find((t) => t.value === tipoEvento)?.label}
          </p>

          {prazos.map((prazo) => {
            const cfg = STATUS_CONFIG[prazo.status]
            const Icon = cfg.icon

            return (
              <Card
                key={prazo.label}
                variant="light"
                className={`p-6 border ${cfg.border} ${prazo.status === 'critical' || prazo.status === 'expired' ? 'ring-1 ring-inset ' + cfg.border : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                      <h3 className="font-sans font-bold text-slate-900">{prazo.label}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2">{prazo.fundamentacao}</p>
                  </div>

                  <div className="flex sm:flex-col items-end gap-3 sm:gap-1 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Vencimento</p>
                      <p className="font-sans font-bold text-slate-800">
                        {format(prazo.expiresAt, "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className={`text-right rounded-lg px-3 py-2 ${cfg.bg}`}>
                      <p className="text-xs text-slate-500">
                        {prazo.daysLeft >= 0 ? 'Restam' : 'Expirou há'}
                      </p>
                      <p className={`font-sans font-bold text-xl ${cfg.color}`}>
                        {Math.abs(prazo.daysLeft)} dias
                      </p>
                    </div>
                  </div>
                </div>

                {/* Barra de progresso */}
                {prazo.status !== 'expired' && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          prazo.status === 'safe' ? 'bg-emerald-400' :
                          prazo.status === 'warning' ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(2, (prazo.daysLeft / (prazo.label === 'Decadência' ? 3650 : 1825)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          {/* Aviso legal */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Atenção:</strong> Os prazos podem ser suspensos ou interrompidos por causas legais (ex.: incapacidade civil, requerimento administrativo, ação judicial). Verifique sempre o caso concreto antes de concluir pelo decurso do prazo.
            </p>
          </div>
        </div>
      )}

      {!dataEvento && (
        <Card variant="light" className="p-8 text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Informe a data do fato gerador para calcular os prazos</p>
        </Card>
      )}
    </div>
  )
}
