'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, TrendingUp, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
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
    features: ['30 clientes', 'Cálculos ilimitados', '20 pareceres IA/mês', 'Simulador', 'Retroativos', 'Export PDF', 'WhatsApp'],
  },
  {
    id: 'PRO',
    name: 'PRO',
    price: 'R$ 197/mês',
    features: ['Clientes ilimitados', 'Tudo do SOLO', 'Pareceres ilimitados', 'Suporte prioritário'],
  },
]

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Ativo', color: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
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
      <div className="p-4 sm:p-6 max-w-4xl space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6 max-w-4xl p-4 sm:p-6">
      <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Assinatura</h1>

      {successStatus === 'success' && (
        <div className="border border-green-200 bg-green-50 p-4 rounded-md animate-fade-in" role="alert">
          <p className="font-sans font-semibold text-green-800">✓ Assinatura ativada com sucesso!</p>
          <p className="font-sans text-sm text-green-700 mt-1">Seu plano foi atualizado. Aproveite os recursos!</p>
        </div>
      )}

      {/* Current Plan Card */}
      <Card variant="dark">
        <CardHeader title="Plano Atual" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <p className="font-serif font-bold text-3xl text-slate-900">{planDisplayName}</p>
              {statusInfo && (
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 font-sans font-bold text-[10px] uppercase tracking-wide rounded-full border', statusInfo.color)}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              )}
            </div>
            {planInfo?.nextBillingDate && (
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <p className="font-sans text-xs text-slate-500">
                  Próxima cobrança: {formatDate(planInfo.nextBillingDate)}
                </p>
              </div>
            )}
            {planInfo?.planExpiresAt && currentPlan !== 'FREE' && !isManagedPlan && (
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                Expira em: {formatDate(planInfo.planExpiresAt)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isManagedPlan && currentPlan !== 'FREE' && (
              <Button variant="outline" onClick={handleCancel} loading={cancelling} size="sm">
                Cancelar
              </Button>
            )}
            {!isManagedPlan && currentPlan === 'FREE' && (
              <Button variant="primary" size="sm" onClick={() => handleSubscribe('SOLO')} loading={subscribing === 'SOLO'}>
                Fazer Upgrade
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Usage Section (only for paid plans with limits) */}
      {usageItems.length > 0 && (
        <Card>
          <CardHeader title="Uso do Plano" />
          <div className="space-y-3">
            {usageItems.map((item) => {
              if (item.max === -1) return null // Unlimited
              const pct = Math.min((item.used / item.max) * 100, 100)
              const isCritical = pct >= 100
              const isWarning = pct >= 80

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans text-sm text-slate-600">{item.label}</span>
                    <span className={cn('font-sans text-xs font-medium', isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-500')}>
                      {item.used}/{item.max}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-amber-600')}
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={item.used}
                      aria-valuemin={0}
                      aria-valuemax={item.max}
                    />
                  </div>
                  {isWarning && !isCritical && (
                    <p className="font-sans text-xs text-amber-600 mt-1">
                      ⚠️ Você usou {item.used} de {item.max} {item.label.toLowerCase()}
                    </p>
                  )}
                  {isCritical && (
                    <p className="font-sans text-xs text-red-600 mt-1">
                      🔴 Limite de {item.label.toLowerCase()} atingido
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const canUpgrade = plan.id !== 'FREE' && !isCurrent

          return (
            <div
              key={plan.id}
              className={cn(
                'border rounded-xl p-6 transition-all',
                isCurrent ? 'border-amber-500 bg-amber-50/30 shadow-md ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:border-amber-300'
              )}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-sans font-bold text-slate-900 text-lg uppercase tracking-wide">{plan.name}</p>
                  {isCurrent && (
                    <span className="font-sans font-bold text-[10px] uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      ATUAL
                    </span>
                  )}
                  {plan.id === 'PRO' && !isCurrent && (
                    <span className="font-sans font-bold text-[10px] uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full">
                      POPULAR
                    </span>
                  )}
                </div>
                <p className="font-serif text-amber-700 font-bold text-xl">{plan.price}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="font-sans text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-amber-500 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {canUpgrade && (
                <button
                  onClick={() => handleSubscribe(plan.id as 'SOLO' | 'PRO')}
                  disabled={!!subscribing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 cursor-pointer select-none shadow-sm w-full mt-2 disabled:opacity-50"
                >
                  {subscribing === plan.id ? 'Aguarde...' : `Assinar ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader title="Histórico de Pagamentos" />
          <div className="overflow-x-auto">
            <table className="w-full text-left" role="table">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 px-2">Data</th>
                  <th className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 px-2">Plano</th>
                  <th className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 px-2">Valor</th>
                  <th className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 px-2">Status</th>
                  <th className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 px-2">Período</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-sans text-sm text-slate-700">{formatDate(payment.paidAt)}</td>
                    <td className="py-3 px-2 font-sans text-sm text-slate-700">{payment.plan}</td>
                    <td className="py-3 px-2 font-sans text-sm font-medium text-slate-900">{formatCurrency(payment.amount)}</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 font-sans font-bold text-[10px] uppercase rounded-full',
                        payment.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        payment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        payment.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        {payment.status === 'APPROVED' ? 'Aprovado' :
                         payment.status === 'PENDING' ? 'Pendente' :
                         payment.status === 'REJECTED' ? 'Rejeitado' :
                         payment.status === 'CANCELLED' ? 'Cancelado' :
                         payment.status === 'REFUNDED' ? 'Estornado' : payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-sans text-xs text-slate-500">
                      {payment.periodStart && payment.periodEnd
                        ? `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* FAQ Section */}
      <details className="bg-white border border-slate-200 rounded-xl p-4 group">
        <summary className="font-sans font-semibold text-sm text-slate-700 cursor-pointer flex items-center justify-between">
          Perguntas frequentes sobre planos
          <TrendingUp className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" aria-hidden="true" />
        </summary>
        <div className="mt-4 space-y-4">
          {[
            { q: 'O que acontece se eu cancelar?', a: 'Seu plano permanece ativo até o fim do período já pago. Após isso, seu plano será rebaixado para FREE.' },
            { q: 'Posso fazer downgrade?', a: 'Sim. Ao final do período vigente, você pode migrar para um plano inferior. Entre em contato com o suporte.' },
            { q: 'Quais formas de pagamento são aceitas?', a: 'Cartão de crédito (todas as bandeiras) via Mercado Pago. Pagamento 100% seguro e processado pelo Mercado Pago.' },
            { q: 'Os dados são seguros?', a: 'Sim. Todos os dados são criptografados em trânsito (HTTPS) e em repouso. CPFs são armazenados com hash HMAC-SHA256.' },
            { q: 'Como funciona o período de teste gratuito?', a: 'O plano FREE é totalmente gratuito, sem necessidade de cartão de crédito. Você pode testar todos os recursos básicos antes de assinar.' },
          ].map((faq, i) => (
            <div key={i}>
              <p className="font-sans text-sm font-semibold text-slate-700">{faq.q}</p>
              <p className="font-sans text-sm text-slate-500 mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </details>
    </div>

      <ConfirmDialog
        open={confirmCancel}
        onConfirm={confirmCancelAction}
        onCancel={() => setConfirmCancel(false)}
        title="Cancelar assinatura?"
        message="Deseja cancelar sua assinatura? Seu plano permanece ativo até o fim do período já pago."
        confirmLabel="Sim, Cancelar"
        variant="warning"
        loading={cancelling}
      />
    </ErrorBoundary>
  )
}
