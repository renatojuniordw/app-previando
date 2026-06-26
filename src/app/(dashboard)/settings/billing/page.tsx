'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface PlanInfo {
  plan: string
  planStatus: string | null
  planExpiresAt: string | null
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
    price: 'R$ 299/mês',
    features: ['30 clientes', 'Cálculos ilimitados', '20 pareceres IA/mês', 'Simulador', 'Retroativos', 'Export PDF', 'WhatsApp'],
  },
  {
    id: 'PRO',
    name: 'PRO',
    price: 'R$ 599/mês',
    features: ['Clientes ilimitados', 'Tudo do SOLO', 'Pareceres ilimitados', 'Suporte prioritário'],
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const { addToast } = useToast()

  const successStatus = searchParams.get('status')

  useEffect(() => {
    api.get('/billing/plans')
      .then((r) => setPlanInfo(r.data))
      .catch(() => null)
      .finally(() => setLoading(false))
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

  const handleCancel = async () => {
    if (!confirm('Deseja cancelar sua assinatura?')) return
    setCancelling(true)
    try {
      await api.post('/billing/cancel')
      addToast({ type: 'success', title: 'Assinatura cancelada', message: 'Seu plano permanece ativo até o fim do período.' })
      window.location.reload()
    } catch {
      setCancelling(false)
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível cancelar a assinatura.' })
    }
  }

  const currentPlan = planInfo?.plan ?? session?.user?.plan ?? 'FREE'

  if (loading) {
    return <div className="font-sans font-medium text-slate-500 animate-pulse p-6">Carregando...</div>
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6 max-w-4xl p-4 sm:p-6">
      <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Assinatura</h1>

      {successStatus === 'success' && (
        <div className="border border-green-200 bg-green-50 p-4 rounded-md">
          <p className="font-sans font-semibold text-green-800">✓ Assinatura ativada com sucesso!</p>
          <p className="font-sans text-sm text-green-700 mt-1">Seu plano foi atualizado. Aproveite os recursos!</p>
        </div>
      )}

      <Card variant="dark">
        <CardHeader title="Plano Atual" />
        <div className="flex align-items-center justify-content-between">
          <div>
            <p className="font-serif font-bold text-3xl text-slate-900">{currentPlan}</p>
            {planInfo?.planStatus && planInfo.planStatus !== 'ACTIVE' && (
              <p className="font-sans font-medium text-xs text-[var(--color-primary)] mt-1 uppercase tracking-wide">{planInfo.planStatus}</p>
            )}
          </div>
          {currentPlan !== 'FREE' && (
            <Button variant="outline" onClick={handleCancel} loading={cancelling} size="sm">
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const canUpgrade = plan.id !== 'FREE' && !isCurrent

          return (
            <div
              key={plan.id}
              className={`border rounded-xl p-6 transition-all ${isCurrent ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)]/30 shadow-md ring-1 ring-[var(--color-primary)]' : 'border-slate-200 bg-white hover:border-[#EB8B6A]'}`}
            >
              <div className="mb-4">
                <div className="flex align-items-center justify-content-between mb-2">
                  <p className="font-sans font-bold text-slate-900 text-lg uppercase tracking-wide">{plan.name}</p>
                  {isCurrent && (
                    <span className="font-sans font-bold text-[10px] uppercase bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">
                      ATUAL
                    </span>
                  )}
                </div>
                <p className="font-serif text-[var(--color-primary-dark)] font-bold text-xl">{plan.price}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="font-sans text-sm text-slate-600 flex align-items-start gap-2">
                    <span className="text-[var(--color-primary)] flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {canUpgrade && (
                <button
                  onClick={() => handleSubscribe(plan.id as 'SOLO' | 'PRO')}
                  disabled={!!subscribing}
                  className="inline-flex align-items-center justify-content-center gap-2 px-4 py-2.5 font-sans font-medium text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200 cursor-pointer select-none neo-btn w-full mt-2"
                >
                  {subscribing === plan.id ? 'Aguarde...' : `Assinar ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </ErrorBoundary>
  )
}
