'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

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

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

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
        fetch(`/api/billing/plans?plan=${plan}`, { headers: { 'x-admin-secret': ADMIN_SECRET } })
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
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify(editData),
      })
      setMessage(`Plano ${editing} atualizado.`)
      setEditing(null)
      // Reload
      const r = await fetch(`/api/billing/plans?plan=${editing}`, { headers: { 'x-admin-secret': ADMIN_SECRET } })
      const data = await r.json()
      setPlans((prev) => prev.map((p) => p.plan === editing ? (data.planLimit ?? p) : p))
    } catch {
      setMessage('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 font-mono text-slate-400 animate-pulse">Carregando...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-mono font-black text-2xl text-white uppercase">PLANOS</h1>
      {message && (
        <div className="border-2 border-[#ccff00] bg-slate-900 p-3">
          <p className="font-mono text-xs text-[#ccff00]">{message}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.plan} className="border-2 border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono font-black text-white uppercase">{plan.plan}</p>
              <button
                onClick={() => handleEdit(plan)}
                className="font-mono text-[10px] uppercase tracking-widest border-2 border-slate-600 text-slate-400 px-3 py-1 hover:border-[#ccff00] hover:text-[#ccff00] transition-colors"
              >
                EDITAR
              </button>
            </div>

            {editing === plan.plan ? (
              <div className="space-y-3">
                {([
                  { key: 'maxClients', label: 'Max Clientes', type: 'number' },
                  { key: 'maxCalculationsPerMonth', label: 'Max Cálculos/mês', type: 'number' },
                  { key: 'maxOpinionsPerMonth', label: 'Max Pareceres/mês', type: 'number' },
                ] as const).map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="font-mono text-[10px] text-slate-400 uppercase block mb-1">{label}</label>
                    <input
                      type={type}
                      value={String(editData[key] ?? '')}
                      onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value === '' ? null : Number(e.target.value) }))}
                      className="neo-input py-1 text-sm"
                      placeholder="null = ilimitado"
                    />
                  </div>
                ))}
                {([
                  'simulatorEnabled', 'retroativosEnabled',
                  'exportPdfEnabled', 'whatsappShareEnabled', 'watermarkEnabled',
                ] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editData[key])}
                      onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-[#ccff00]"
                    />
                    <span className="font-mono text-xs text-slate-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSave} loading={saving} className="flex-1">SALVAR</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="flex-1">CANCELAR</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                <p className="text-slate-400">Max Clientes: <span className="text-white">{plan.maxClients ?? '∞'}</span></p>
                <p className="text-slate-400">Max Cálculos: <span className="text-white">{plan.maxCalculationsPerMonth ?? '∞'}/mês</span></p>
                <p className="text-slate-400">Max Pareceres: <span className="text-white">{plan.maxOpinionsPerMonth ?? '∞'}/mês</span></p>
                <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
                  {([
                    ['simulatorEnabled', 'Simulador'],
                    ['retroativosEnabled', 'Retroativos'],
                    ['exportPdfEnabled', 'Export PDF'],
                    ['whatsappShareEnabled', 'WhatsApp'],
                    ['watermarkEnabled', 'Marca d\'água'],
                  ] as const).map(([key, label]) => (
                    <p key={key} className="text-slate-400">
                      {label}: <span className={plan[key] ? 'text-[#ccff00]' : 'text-red-400'}>{plan[key] ? '✓' : '✗'}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
