'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface PlanLimitData {
  plan: string
  maxClients: number
  maxCalculationsPerMonth: number
  maxOpinionsPerMonth: number
  maxNotesPerCase: number
  simulatorEnabled: boolean
  retroactiveEnabled: boolean
  exportPdfEnabled: boolean
  watermarkEnabled: boolean
  diagnosisEnabled: boolean
  bpcEnabled: boolean
  bpcAnalysesPerMonth: number
  bpcSocialMediaPerMonth: number
  peticaoEnabled: boolean
  maxPeticoesPerMonth: number
  processInterpretEnabled: boolean
  maxProcessInterpretPerMonth: number
}

function fmtUnlimited(value: number, suffix = ''): string {
  if (value === -1) return `∞${suffix}`
  return `${value}${suffix}`
}

const NUMERIC_FIELDS: { key: keyof PlanLimitData; label: string; suffix: string }[] = [
  { key: 'maxClients', label: 'Max Clientes', suffix: '' },
  { key: 'maxCalculationsPerMonth', label: 'Max Cálculos/mês', suffix: '' },
  { key: 'maxOpinionsPerMonth', label: 'Max Pareceres/mês', suffix: '' },
  { key: 'maxNotesPerCase', label: 'Max Anotações/caso', suffix: '' },
  { key: 'bpcAnalysesPerMonth', label: 'Análises BPC/mês', suffix: '' },
  { key: 'bpcSocialMediaPerMonth', label: 'Entrevistas Sociais BPC/mês', suffix: '' },
  { key: 'maxPeticoesPerMonth', label: 'Petições IA/mês', suffix: '' },
  { key: 'maxProcessInterpretPerMonth', label: 'Interpretações IA/mês', suffix: '' },
]

const BOOLEAN_FIELDS: { key: keyof PlanLimitData; label: string }[] = [
  { key: 'simulatorEnabled', label: 'Simulador' },
  { key: 'retroactiveEnabled', label: 'Retroativos' },
  { key: 'exportPdfEnabled', label: 'Export PDF' },

  { key: 'watermarkEnabled', label: 'Marca d\'água' },
  { key: 'diagnosisEnabled', label: 'Diagnóstico IA' },
  { key: 'bpcEnabled', label: 'Módulo BPC/LOAS' },
  { key: 'peticaoEnabled', label: 'Petição Inicial IA' },
  { key: 'processInterpretEnabled', label: 'Interpretação de movimentações' },
]

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanLimitData[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<PlanLimitData>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadPlans = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/billing/plans')
      const data = await r.json()
      setPlans((data.plans ?? []).map((p: { plan: string; limits: PlanLimitData }) => ({
        ...p.limits,
        plan: p.plan,
      })))
    } catch {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlans() }, [])

  const handleEdit = (plan: PlanLimitData) => {
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
      await loadPlans()
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
                  {NUMERIC_FIELDS.map(({ key, label, suffix }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editData[key] !== undefined ? (editData[key] as number) : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? -1 : Number(e.target.value)
                            setEditData((d) => ({ ...d, [key]: val }))
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder="-1 = ilimitado"
                        />
                        {suffix && <span className="text-xs text-slate-400 shrink-0">{suffix}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">-1 = ilimitado</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Features</p>
                  {BOOLEAN_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editData[key])}
                        onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.checked }))}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
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
                {NUMERIC_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex justify-between pb-2 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900">
                      {key === 'maxCalculationsPerMonth' || key === 'maxOpinionsPerMonth' || key === 'bpcAnalysesPerMonth' || key === 'bpcSocialMediaPerMonth'
                        ? fmtUnlimited(plan[key] as number, '/mês')
                        : fmtUnlimited(plan[key] as number)}
                    </span>
                  </div>
                ))}
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Features</p>
                  {BOOLEAN_FIELDS.map(({ key, label }) => (
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
