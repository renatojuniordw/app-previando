'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Package, Check, X } from 'lucide-react'

interface PlanLimit {
  plan: string
  maxClients: number | null
  maxCalculationsPerMonth: number | null
  maxOpinionsPerMonth: number | null
  simulatorEnabled: boolean
  retroativosEnabled: boolean
  exportPdfEnabled: boolean
  whatsappShareEnabled: boolean
  watermarkEnabled: boolean
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanLimit[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<PlanLimit>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all(
      ['FREE', 'SOLO', 'PRO'].map((plan) =>
        fetch(`/api/billing/plans?plan=${plan}`)
          .then((r) => r.json())
          .then((d) => d.planLimit as PlanLimit)
          .catch(() => null)
      )
    )
      .then((results) => setPlans(results.filter(Boolean) as PlanLimit[]))
      .finally(() => setLoading(false))
  }, [])

  const handleEdit = (plan: PlanLimit) => {
    setEditing(plan.plan)
    setEditData({ ...plan })
    setMessage('')
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await fetch(`/api/admin/plans/${editing}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      setMessage(`Plano ${editing} atualizado com sucesso.`)
      setEditing(null)
      const r = await fetch(`/api/billing/plans?plan=${editing}`)
      const data = await r.json()
      setPlans((prev) => prev.map((p) => p.plan === editing ? (data.planLimit ?? p) : p))
    } catch {
      setMessage('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
          <p className="font-sans text-sm text-slate-500 animate-pulse">Carregando planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-slate-900">Planos</h1>
        <p className="font-sans text-sm text-slate-500 mt-1">Gerencie os limites e features de cada plano</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="font-sans text-sm font-medium text-emerald-700">{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.plan} variant="light" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">{plan.plan}</h3>
              </div>
              {editing !== plan.plan && (
                <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                  Editar
                </Button>
              )}
            </div>

            {editing === plan.plan ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Max Clientes</label>
                    <input
                      type="number"
                      value={String(editData.maxClients ?? '')}
                      onChange={(e) => setEditData((d) => ({ ...d, maxClients: e.target.value === '' ? null : Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="null = ilimitado"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Max Cálculos/mês</label>
                    <input
                      type="number"
                      value={String(editData.maxCalculationsPerMonth ?? '')}
                      onChange={(e) => setEditData((d) => ({ ...d, maxCalculationsPerMonth: e.target.value === '' ? null : Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="null = ilimitado"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Max Pareceres/mês</label>
                    <input
                      type="number"
                      value={String(editData.maxOpinionsPerMonth ?? '')}
                      onChange={(e) => setEditData((d) => ({ ...d, maxOpinionsPerMonth: e.target.value === '' ? null : Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="null = ilimitado"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {(['simulatorEnabled', 'retroativosEnabled', 'exportPdfEnabled', 'whatsappShareEnabled', 'watermarkEnabled'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editData[key])}
                        onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.checked }))}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSave} loading={saving} className="flex-1">Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Max Clientes</span>
                  <span className="font-semibold text-slate-900">{plan.maxClients ?? '∞'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Max Cálculos</span>
                  <span className="font-semibold text-slate-900">{plan.maxCalculationsPerMonth ?? '∞'}/mês</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Max Pareceres</span>
                  <span className="font-semibold text-slate-900">{plan.maxOpinionsPerMonth ?? '∞'}/mês</span>
                </div>
                <div className="space-y-1 pt-1">
                  {([
                    ['simulatorEnabled', 'Simulador'],
                    ['retroativosEnabled', 'Retroativos'],
                    ['exportPdfEnabled', 'Export PDF'],
                    ['whatsappShareEnabled', 'WhatsApp'],
                    ['watermarkEnabled', 'Marca d\'água'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{label}</span>
                      <span className={plan[key] ? 'text-emerald-600 font-bold' : 'text-red-400 font-bold'}>
                        {plan[key] ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
