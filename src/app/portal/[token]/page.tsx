import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Scale, FileText, Calculator, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { PortalSimulator } from '@/components/portal/PortalSimulator'

const BENEFIT_LABELS: Record<string, string> = {
  RETIREMENT_BY_AGE: 'Aposentadoria por Idade',
  RETIREMENT_BY_CONTRIBUTION_TIME: 'Aposentadoria por Tempo de Contribuição',
  SPECIAL_RETIREMENT: 'Aposentadoria Especial',
  HYBRID_RETIREMENT: 'Aposentadoria Híbrida',
  POINTS_RETIREMENT: 'Aposentadoria por Pontos',
  SICKNESS_BENEFIT: 'Auxílio-Doença',
  ACCIDENT_BENEFIT: 'Auxílio-Acidente',
  MATERNITY_PAY: 'Salário-Maternidade',
  PRISONER_BENEFIT: 'Auxílio-Reclusão',
  DEATH_PENSION: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
  BENEFIT_REVIEW: 'Revisão de Benefício',
}

const MODALITY_LABELS: Record<string, string> = {
  POINTS_86_96: 'Regra de Transição — Pontos (86/96)',
  TOLL_50: 'Regra de Transição — Pedágio 50%',
  TOLL_100: 'Regra de Transição — Pedágio 100%',
  MINIMUM_AGE_65_62: 'Regra de Transição — Idade Mínima',
  CONTRIBUTION_TIME: 'Aposentadoria por Tempo de Contribuição',
  RETIREMENT_BY_AGE: 'Aposentadoria por Idade',
  SPECIAL_RETIREMENT: 'Aposentadoria Especial',
  HYBRID: 'Aposentadoria Híbrida',
  SICKNESS_BENEFIT_B31: 'Auxílio-Doença Previdenciário (B31)',
  SICKNESS_BENEFIT_B91: 'Auxílio-Doença Acidentário (B91)',
  MATERNITY_PAY: 'Salário-Maternidade',
  PRISONER_BENEFIT: 'Auxílio-Reclusão',
  DEATH_PENSION: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
}

interface Props {
  params: { token: string }
}

export async function generateMetadata({ params }: Props) {
  return {
    title: 'Portal do Cliente — Previando',
    robots: 'noindex',
  }
}

export default async function PortalPage({ params }: Props) {
  const access = await prisma.clientAccess.findUnique({
    where: { token: params.token },
    include: {
      case: {
        include: {
          client: { select: { name: true, birthDate: true } },
          calculations: {
            where: { isSelected: true },
            orderBy: { rmi: 'desc' },
          },
          retroactives: { orderBy: { createdAt: 'desc' }, take: 1 },
          user: { select: { name: true, oabNumber: true, plan: true } },
        },
      },
    },
  })

  if (!access || access.expiresAt < new Date()) {
    notFound()
  }

  const { case: c } = access
  const hasWatermark = c.user.plan === 'FREE'
  const bestCalc = c.calculations[0]
  const hasSimulator = c.user.plan === 'SOLO' || c.user.plan === 'PRO'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <span className="font-serif font-bold text-lg text-slate-900">Previando</span>
          </div>
          <p className="font-sans text-xs text-slate-400">
            Link válido até {formatDate(access.expiresAt.toISOString())}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Marca d'água para plano FREE */}
        {hasWatermark && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center">
            <p className="font-sans text-xs text-amber-700">
              Análise gerada pelo Previando — sistema de cálculos previdenciários
            </p>
          </div>
        )}

        {/* Dados do cliente e caso */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span className="font-sans text-sm font-medium uppercase tracking-wide">Dados do Caso</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-sans text-xs text-slate-400">Cliente</p>
              <p className="font-sans font-semibold text-slate-900">{c.client.name}</p>
            </div>
            <div>
              <p className="font-sans text-xs text-slate-400">Data de Nascimento</p>
              <p className="font-sans font-semibold text-slate-900">
                {formatDate(c.client.birthDate.toISOString())}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-slate-400">Tipo de Benefício</p>
              <p className="font-sans font-semibold text-slate-900">
                {BENEFIT_LABELS[c.benefitType] ?? c.benefitType}
              </p>
            </div>
            {c.processNumber && (
              <div>
                <p className="font-sans text-xs text-slate-400">Processo</p>
                <p className="font-sans font-semibold text-slate-900">{c.processNumber}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="font-sans text-xs text-slate-400">Advogado Responsável</p>
            <p className="font-sans font-semibold text-slate-900">{c.user.name}</p>
            {c.user.oabNumber && (
              <p className="font-sans text-xs text-slate-500">OAB: {c.user.oabNumber}</p>
            )}
          </div>
        </div>

        {/* Simulador E se? - Apenas SOLO/PRO */}
        {hasSimulator && (
          <PortalSimulator token={params.token} />
        )}

        {/* Cálculos selecionados */}
        {c.calculations.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Calculator className="w-4 h-4" aria-hidden="true" />
              <span className="font-sans text-sm font-medium uppercase tracking-wide">
                Cálculos do Benefício
              </span>
            </div>

            {/* Destaque melhor resultado */}
            {bestCalc && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {bestCalc.eligible ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  )}
                  <span className="font-sans text-sm font-semibold text-slate-800">
                    {MODALITY_LABELS[bestCalc.modality] ?? bestCalc.modality}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="font-sans text-xs text-slate-500">RMI</p>
                    <p className="font-sans font-bold text-xl text-amber-700">
                      {formatCurrency(Number(bestCalc.rmi))}
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-xs text-slate-500">RMA</p>
                    <p className="font-sans font-semibold text-slate-800">
                      {formatCurrency(Number(bestCalc.rma))}
                    </p>
                  </div>
                  {bestCalc.expectedDib && (
                    <div>
                      <p className="font-sans text-xs text-slate-500">DIB Estimada</p>
                      <p className="font-sans font-semibold text-slate-800">
                        {formatDate(bestCalc.expectedDib.toISOString())}
                      </p>
                    </div>
                  )}
                  {bestCalc.contributionTime != null && (
                    <div>
                      <p className="font-sans text-xs text-slate-500">Tempo de Contribuição</p>
                      <p className="font-sans font-semibold text-slate-800">
                        {bestCalc.contributionTime} meses
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Demais cálculos */}
            {c.calculations.length > 1 && (
              <div className="space-y-2">
                {c.calculations.slice(1).map((calc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      {calc.eligible ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className="font-sans text-sm text-slate-700">
                        {MODALITY_LABELS[calc.modality] ?? calc.modality}
                      </span>
                    </div>
                    <span className="font-sans text-sm font-semibold text-slate-800">
                      {formatCurrency(Number(calc.rmi))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Retroativos */}
        {c.retroactives.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className="font-sans text-sm font-medium uppercase tracking-wide">
                Valores Retroativos
              </span>
            </div>
            {c.retroactives.map((r, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-sans text-xs text-slate-400">Competência Inicial</p>
                  <p className="font-sans font-semibold text-slate-900">
                    {formatDate(r.entitlementStartDate.toISOString())}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-xs text-slate-400">Meses de Atraso</p>
                  <p className="font-sans font-semibold text-slate-900">{r.monthsLate} meses</p>
                </div>
                <div>
                  <p className="font-sans text-xs text-slate-400">Total Bruto</p>
                  <p className="font-sans font-semibold text-slate-900">
                    {formatCurrency(Number(r.totalGrossValue))}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-xs text-slate-400">Total Corrigido ({r.correctionIndex})</p>
                  <p className="font-sans font-semibold text-slate-900">
                    {formatCurrency(Number(r.totalCorrectedValue))}
                  </p>
                </div>
                <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="font-sans text-xs text-green-600 font-medium">Valor Líquido Final</p>
                  <p className="font-sans font-bold text-xl text-green-700">
                    {formatCurrency(Number(r.finalNetValue))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé */}
        <p className="font-sans text-xs text-slate-400 text-center pb-6">
          Este documento é de uso exclusivo do cliente e seu advogado. Gerado pelo{' '}
          <span className="text-amber-600 font-medium">Previando</span>.
        </p>
      </main>
    </div>
  )
}
