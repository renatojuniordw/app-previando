'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
      window.location.reload()
    } catch {
      setCancelling(false)
    }
  }

  const currentPlan = planInfo?.plan ?? session?.user?.plan ?? 'FREE'

  if (loading) {
    return <div className="font-sans font-medium text-slate-500 animate-pulse p-6">Carregando...</div>
  }

  return (
    <div className="space-y-6 max-w-2xl p-6">
      <h1 className="font-serif font-bold text-3xl text-slate-900 tracking-tight">Assinatura</h1>

      {successStatus === 'success' && (
        <div className="border border-green-200 bg-green-50 p-4 rounded-md">
          <p className="font-sans font-semibold text-green-800">✓ Assinatura ativada com sucesso!</p>
          <p className="font-sans text-sm text-green-700 mt-1">Seu plano foi atualizado. Aproveite os recursos!</p>
        </div>
      )}

      <Card variant="dark">
        <CardHeader title="Plano Atual" />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif font-bold text-3xl text-slate-900">{currentPlan}</p>
            {planInfo?.planStatus && planInfo.planStatus !== 'ACTIVE' && (
              <p className="font-sans font-medium text-xs text-amber-600 mt-1 uppercase tracking-wide">{planInfo.planStatus}</p>
            )}
          </div>
          {currentPlan !== 'FREE' && (
            <Button variant="outline" onClick={handleCancel} loading={cancelling} size="sm">
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const canUpgrade = plan.id !== 'FREE' && !isCurrent

          return (
            <div
              key={plan.id}
              className={`border rounded-xl p-6 transition-all ${isCurrent ? 'border-amber-500 bg-amber-50/30 shadow-md ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:border-amber-300'}`}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-sans font-bold text-slate-900 text-lg uppercase tracking-wide">{plan.name}</p>
                  {isCurrent && (
                    <span className="font-sans font-bold text-[10px] uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      ATUAL
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
                  className="neo-btn w-full mt-2"
                >
                  {subscribing === plan.id ? 'Aguarde...' : `Assinar ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
