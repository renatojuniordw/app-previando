import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Scale, FileText, Calculator, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { PortalSimulator } from '@/components/portal/PortalSimulator'
import { PortalContent } from './PortalContent'

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
          client: { select: { name: true, birthDate: true, cpfHash: true } },
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

  // Lê portalConfig para saber se precisa de verificação
  const casoData = c as unknown as {
    portalConfig?: { requireIdentity?: boolean }
  }
  const requireIdentity = casoData.portalConfig?.requireIdentity ?? false

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

        {/* Conteúdo protegido por identidade (cálculos + retroativos) */}
        <PortalContent
          token={params.token}
          calculations={c.calculations.map((calc) => ({
            ...calc,
            rmi: Number(calc.rmi),
            rma: Number(calc.rma),
            benefitSalary: Number(calc.benefitSalary),
          }))}
          retroactives={c.retroactives.map((r) => ({
            ...r,
            totalGrossValue: Number(r.totalGrossValue),
            totalCorrectedValue: Number(r.totalCorrectedValue),
            finalNetValue: Number(r.finalNetValue),
          }))}
          requireIdentity={requireIdentity}
        />

        {/* Rodapé */}
        <p className="font-sans text-xs text-slate-400 text-center pb-6">
          Este documento é de uso exclusivo do cliente e seu advogado. Gerado pelo{' '}
          <span className="text-amber-600 font-medium">Previando</span>.
        </p>
      </main>
    </div>
  )
}
