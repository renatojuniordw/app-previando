import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Scale, FileText, Download } from 'lucide-react'
import { PortalSimulator } from '@/components/portal/PortalSimulator'
import { PortalContent } from './PortalContent'
import { PortalBpcSection } from './PortalBpcSection'
import { PortalTimeline } from './PortalTimeline'
import { PortalGlossary } from './PortalGlossary'
import { PortalFaq } from './PortalFaq'
import { PortalDocuments } from './PortalDocuments'
import { PORTAL_SESSION_COOKIE, isPortalSessionValid } from '@/lib/portal-session'
import { shouldShowSensitiveData } from '@/lib/portal-config'

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

interface Props {
  params: { token: string }
}

export async function generateMetadata(_params: Props) {
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
          bpcAnalysis: true,
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
  const hasSimulator = c.user.plan === 'SOLO' || c.user.plan === 'PRO'

  // Lê portalConfig para saber o que exibir
  const casoData = c as unknown as {
    portalConfig?: {
      requireIdentity?: boolean
      showCalculations?: boolean
      showRetroactives?: boolean
      showBpcSocialAnalysis?: boolean
      showTimeline?: boolean
      showDocuments?: boolean
      showFaq?: boolean
      showGlossary?: boolean
      showPdfExport?: boolean
    }
  }
  const requireIdentity = casoData.portalConfig?.requireIdentity ?? false
  const showCalculations = casoData.portalConfig?.showCalculations ?? true
  const showRetroactives = casoData.portalConfig?.showRetroactives ?? false
  const showBpcSocialAnalysis = casoData.portalConfig?.showBpcSocialAnalysis ?? false
  const showTimeline = casoData.portalConfig?.showTimeline ?? false
  const showDocuments = casoData.portalConfig?.showDocuments ?? false
  const showFaq = casoData.portalConfig?.showFaq ?? false
  const showGlossary = casoData.portalConfig?.showGlossary ?? false
  const showPdfExport = casoData.portalConfig?.showPdfExport ?? false

  // Gate real do lado do servidor: sem isso, os dados sensíveis (cálculos,
  // retroativos) seriam embutidos no HTML/RSC payload antes de qualquer
  // verificação no cliente, tornando a checagem apenas cosmética.
  const verifiedCookie = cookies().get(PORTAL_SESSION_COOKIE)?.value
  const identityVerified = !requireIdentity || isPortalSessionValid(verifiedCookie, params.token)

  return (
    <div className="min-h-dvh bg-slate-50">
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

        {/* Conteúdo protegido por identidade (cálculos + retroativos).
            Quando requireIdentity=true e a sessão não está verificada, os
            arrays abaixo ficam vazios — os dados nunca chegam ao HTML. */}
        <PortalContent
          token={params.token}
          calculations={
            shouldShowSensitiveData(showCalculations, identityVerified)
              ? c.calculations.map((calc) => ({
                  ...calc,
                  rmi: Number(calc.rmi),
                  rma: Number(calc.rma),
                  benefitSalary: Number(calc.benefitSalary),
                }))
              : []
          }
          retroactives={
            shouldShowSensitiveData(showRetroactives, identityVerified)
              ? c.retroactives.map((r) => ({
                  ...r,
                  totalGrossValue: Number(r.totalGrossValue),
                  totalCorrectedValue: Number(r.totalCorrectedValue),
                  finalNetValue: Number(r.finalNetValue),
                }))
              : []
          }
          requireIdentity={requireIdentity}
          initialVerified={identityVerified}
        />
        {c.benefitType === 'BPC_LOAS' &&
          c.bpcAnalysis &&
          shouldShowSensitiveData(showBpcSocialAnalysis, identityVerified) && (
            <PortalBpcSection
              analysis={{
                ...c.bpcAnalysis,
                rendaFamiliar: Number(c.bpcAnalysis.rendaFamiliar),
                rendaPerCapita: Number(c.bpcAnalysis.rendaPerCapita),
              }}
            />
          )}

        {shouldShowSensitiveData(showDocuments, identityVerified) && (
          <PortalDocuments token={params.token} />
        )}

        {shouldShowSensitiveData(showTimeline, identityVerified) && (
          <PortalTimeline token={params.token} />
        )}

        {showFaq && <PortalFaq token={params.token} />}

        {showGlossary && <PortalGlossary />}

        {shouldShowSensitiveData(showPdfExport, identityVerified) && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-sm font-semibold text-slate-800">Exportar Relatório</p>
                <p className="font-sans text-xs text-slate-400 mt-0.5">
                  Baixe um resumo completo dos dados do seu caso em PDF
                </p>
              </div>
              <a
                href={`/api/portal/${params.token}/export-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar PDF
              </a>
            </div>
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
