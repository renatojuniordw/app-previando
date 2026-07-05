'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, TrendingUp, CheckCircle2, XCircle, AlertCircle, CreditCard, Activity, Box, History, HelpCircle, FileText, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanInfo {
  plan: string
  planStatus: string | null
  planExpiresAt: string | null
  nextBillingDate?: string | null
  mpSubscriptionStatus?: string | null
  usage?: {
    totalClients: number
    calculationsThisMonth: number
    opinionsThisMonth: number
    bpcAnalysesThisMonth: number
  }
  limits?: {
    maxClients: number
    maxCalculationsPerMonth: number
    maxOpinionsPerMonth: number
    bpcAnalysesPerMonth: number
  }
  payments?: Array<{
    id: string
    amount: number
    status: string
    paidAt: string
    plan: string
    periodStart: string
    periodEnd: string
  }>
}

const PLANS = [
  {
    id: 'FREE',
    name: 'FREE',
    price: 'Grátis',
    features: ['3 clientes', '5 cálculos/mês', '1 parecer IA/mês', 'Marca d\'água no PDF'],
  },
  {
    id: 'SOLO',
    name: 'SOLO',
    price: 'R$ 97/mês',
    features: ['30 clientes', 'Cálculos ilimitados', '20 pareceres IA/mês', 'Simulador', 'Retroativos', 'Export PDF'],
  },
  {
    id: 'PRO',
    name: 'PRO',
    price: 'R$ 197/mês',
    features: ['Clientes ilimitados', 'Tudo do SOLO', 'Pareceres ilimitados', 'Suporte prioritário'],
  },
]

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Ativo', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  PAST_DUE: { label: 'Pagamento Pendente', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <AlertCircle className="w-4 h-4 text-amber-500" /> },
  CANCELLED: { label: 'Cancelado', color: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4 text-red-500" /> },
  SUSPENDED: { label: 'Suspenso', color: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4 text-red-500" /> },
}

export default function BillingPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { addToast } = useToast()

  const successStatus = searchParams.get('status')

  const fetchPlanInfo = () => {
    setLoading(true)
    api.get('/billing/plans')
      .then((r) => setPlanInfo(r.data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPlanInfo()
  }, [])

  const handleSubscribe = async (plan: 'SOLO' | 'PRO') => {
    setSubscribing(plan)
    try {
      const r = await api.post('/billing/subscribe', { plan })
      window.location.href = r.data.initPoint
    } catch {
      setSubscribing(null)
    }
  }

  const handleCancel = () => {
    setConfirmCancel(true)
  }

  const confirmCancelAction = async () => {
    setConfirmCancel(false)
    setCancelling(true)
    try {
      await api.post('/billing/cancel')
      addToast({ type: 'success', title: 'Assinatura cancelada', message: 'Seu plano permanece ativo até o fim do período.' })
      fetchPlanInfo()
    } catch {
      setCancelling(false)
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível cancelar a assinatura.' })
    }
  }

  const currentPlan = planInfo?.plan ?? session?.user?.plan ?? 'FREE'
  const statusInfo = STATUS_LABELS[planInfo?.planStatus ?? ''] ?? null
  const isManagedPlan = currentPlan === 'PARTNER' || currentPlan === 'ADMIN'
  const planDisplayName = currentPlan === 'PARTNER' ? 'PARCEIRO' : currentPlan === 'ADMIN' ? 'ADMINISTRADOR' : currentPlan

  const usageItems = planInfo?.usage && planInfo?.limits
    ? [
        { label: 'Clientes', used: planInfo.usage.totalClients, max: planInfo.limits.maxClients },
        { label: 'Cálculos/mês', used: planInfo.usage.calculationsThisMonth, max: planInfo.limits.maxCalculationsPerMonth },
        { label: 'Pareceres/mês', used: planInfo.usage.opinionsThisMonth, max: planInfo.limits.maxOpinionsPerMonth },
        { label: 'Análises BPC', used: planInfo.usage.bpcAnalysesThisMonth, max: planInfo.limits.bpcAnalysesPerMonth },
      ].filter((u) => u.max !== 0)
    : []

  const payments = planInfo?.payments ?? []

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
        <div className="animate-pulse space-y-8">
          <div className="h-16 w-64 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 h-32 bg-slate-200 rounded-xl" />
            <div className="md:col-span-2 h-40 bg-slate-100 rounded-xl" />
          </div>
          <hr className="border-slate-100" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 h-32 bg-slate-200 rounded-xl" />
            <div className="md:col-span-2 h-64 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Assinatura</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Gerencie seu plano, pagamentos e limites de uso.</p>
          </div>
        </div>

        {successStatus === 'success' && (
          <div className="border border-emerald-200 bg-emerald-50 p-4 rounded-xl shadow-sm flex items-start gap-3 animate-fade-in" role="alert">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-sans font-bold text-emerald-900">Assinatura ativada com sucesso!</p>
              <p className="font-sans text-sm text-emerald-700 mt-1">Seu plano foi atualizado e seus limites expandidos. Aproveite os recursos!</p>
            </div>
          </div>
        )}

        {/* Section: Plano Atual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1 flex items-start gap-3">
            <div className="mt-0.5">
              <Box className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Plano Atual</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Status e validade da sua assinatura vigente.
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <p className="font-serif font-bold text-3xl text-slate-900 tracking-tight">{planDisplayName}</p>
                  {statusInfo && (
                    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 font-sans font-bold text-[10px] uppercase tracking-wide rounded-md border', statusInfo.color)}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 mt-2">
                  {planInfo?.nextBillingDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <p className="font-sans text-sm text-slate-600">
                        Próxima cobrança: <span className="font-medium text-slate-900">{formatDate(planInfo.nextBillingDate)}</span>
                      </p>
                    </div>
                  )}
                  {planInfo?.planExpiresAt && currentPlan !== 'FREE' && !isManagedPlan && (
                    <div className="flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <p className="font-sans text-sm text-slate-600">
                        Expira em: <span className="font-medium text-slate-900">{formatDate(planInfo.planExpiresAt)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isManagedPlan && currentPlan !== 'FREE' && (
                  <Button variant="outline" onClick={handleCancel} loading={cancelling} className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                    Cancelar Plano
                  </Button>
                )}
                {!isManagedPlan && currentPlan === 'FREE' && (
                  <Button variant="primary" onClick={() => handleSubscribe('SOLO')} loading={subscribing === 'SOLO'} className="w-full sm:w-auto">
                    Fazer Upgrade
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section: Uso do Plano */}
        {usageItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-1 flex items-start gap-3">
                <div className="mt-0.5">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Uso do Plano</h3>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    Acompanhe o consumo dos seus limites mensais e totais.
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                  {usageItems.map((item) => {
                    if (item.max === -1) return null // Unlimited
                    const pct = Math.min((item.used / item.max) * 100, 100)
                    const isCritical = pct >= 100
                    const isWarning = pct >= 80

                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans text-sm font-semibold text-slate-700">{item.label}</span>
                          <span className={cn('font-sans text-sm font-bold', isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-700')}>
                            {item.used} <span className="text-slate-400 font-medium">/ {item.max}</span>
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-slate-800')}
                            style={{ width: `${pct}%` }}
                            role="progressbar"
                            aria-valuenow={item.used}
                            aria-valuemin={0}
                            aria-valuemax={item.max}
                          />
                        </div>
                        {isWarning && !isCritical && (
                          <p className="font-sans text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Você usou {pct.toFixed(0)}% deste recurso.
                          </p>
                        )}
                        {isCritical && (
                          <p className="font-sans text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Limite atingido.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <hr className="border-slate-100" />
          </>
        )}

        {/* Section: Planos Disponíveis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-1 flex items-start gap-3">
            <div className="mt-0.5">
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Planos Disponíveis</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Faça upgrade para desbloquear mais clientes, cálculos e pareceres de IA.
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = currentPlan === plan.id
                const canUpgrade = plan.id !== 'FREE' && !isCurrent

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'border rounded-xl p-5 transition-all flex flex-col',
                      isCurrent ? 'border-amber-500 bg-amber-50/20 shadow-sm ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-sans font-extrabold text-slate-900 text-base uppercase tracking-wide">{plan.name}</p>
                        {isCurrent && (
                          <span className="font-sans font-bold text-[10px] uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            Atual
                          </span>
                        )}
                        {plan.id === 'PRO' && !isCurrent && (
                          <span className="font-sans font-bold text-[10px] uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="font-serif text-slate-900 font-bold text-xl tracking-tight">{plan.price}</p>
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {plan.features.map((f) => (
                        <li key={f} className="font-sans text-sm text-slate-600 flex items-start gap-2 leading-tight">
                          <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {canUpgrade && (
                      <button
                        onClick={() => handleSubscribe(plan.id as 'SOLO' | 'PRO')}
                        disabled={!!subscribing}
                        className="mt-auto w-full inline-flex items-center justify-center px-4 py-2 font-sans font-bold text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50"
                      >
                        {subscribing === plan.id ? 'Aguarde...' : `Assinar`}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section: Histórico de Pagamentos */}
        {payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="md:col-span-1 flex items-start gap-3">
              <div className="mt-0.5">
                <History className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Histórico de Faturas</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  Acesse os comprovantes e status das suas últimas assinaturas.
                </p>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left" role="table">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="font-sans text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3 px-4">Data</th>
                        <th className="font-sans text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3 px-4">Plano</th>
                        <th className="font-sans text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3 px-4">Valor</th>
                        <th className="font-sans text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-sans text-sm font-medium text-slate-900 block">{formatDate(payment.paidAt)}</span>
                            {payment.periodStart && payment.periodEnd && (
                              <span className="font-sans text-[11px] text-slate-500">
                                {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-sm font-bold text-slate-700">{payment.plan}</td>
                          <td className="py-3.5 px-4 font-sans text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</td>
                          <td className="py-3.5 px-4">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-1 font-sans font-bold text-[10px] uppercase tracking-wide rounded-md border',
                              payment.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              payment.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              payment.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            )}>
                              {payment.status === 'APPROVED' ? 'Aprovado' :
                               payment.status === 'PENDING' ? 'Pendente' :
                               payment.status === 'REJECTED' ? 'Rejeitado' :
                               payment.status === 'CANCELLED' ? 'Cancelado' :
                               payment.status === 'REFUNDED' ? 'Estornado' : payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {payments.length > 0 && <hr className="border-slate-100" />}

        {/* FAQ Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pb-10">
          <div className="md:col-span-1 flex items-start gap-3">
            <div className="mt-0.5">
              <HelpCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">FAQ</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Perguntas frequentes sobre planos e faturamento.
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
              {[
                { q: 'O que acontece se eu cancelar?', a: 'Seu plano permanece ativo até o fim do período já pago. Após isso, seu plano será rebaixado para FREE automaticamente.' },
                { q: 'Posso fazer downgrade?', a: 'Sim. Ao final do período vigente, você pode migrar para um plano inferior. Entre em contato com o suporte.' },
                { q: 'Quais formas de pagamento são aceitas?', a: 'Cartão de crédito (todas as principais bandeiras) via Mercado Pago. O processamento é 100% seguro.' },
                { q: 'Os dados são seguros?', a: 'Sim. Todos os dados são criptografados em trânsito (HTTPS) e em repouso. Não armazenamos os dados do seu cartão.' }
              ].map((faq, i) => (
                <div key={i} className="flex gap-4">
                  <FileText className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-sans text-sm font-bold text-slate-900">{faq.q}</h4>
                    <p className="font-sans text-sm text-slate-500 mt-1 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <ConfirmDialog
        open={confirmCancel}
        onConfirm={confirmCancelAction}
        onCancel={() => setConfirmCancel(false)}
        title="Cancelar assinatura?"
        message="Deseja cancelar sua assinatura? Seu plano permanece ativo até o fim do período já pago."
        confirmLabel="Sim, Cancelar Plano"
        variant="warning"
        loading={cancelling}
      />
    </ErrorBoundary>
  )
}
