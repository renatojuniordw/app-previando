'use client'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Check, X, Infinity as InfinityIcon, Package } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { AdminCard } from '@/components/admin/AdminCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { PageError } from '@/components/ui/PageError'
import { useToast } from '@/store/toast'

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

const NUMERIC_FIELDS: { key: keyof PlanLimitData; label: string; suffix: string }[] = [
  { key: 'maxClients', label: 'Max Clientes', suffix: '' },
  { key: 'maxCalculationsPerMonth', label: 'Max Cálculos/mês', suffix: '/mês' },
  { key: 'maxOpinionsPerMonth', label: 'Max Pareceres/mês', suffix: '/mês' },
  { key: 'maxNotesPerCase', label: 'Max Anotações/caso', suffix: '' },
  { key: 'bpcAnalysesPerMonth', label: 'Análises BPC/mês', suffix: '/mês' },
  { key: 'bpcSocialMediaPerMonth', label: 'Entrevistas Sociais BPC/mês', suffix: '/mês' },
  { key: 'maxPeticoesPerMonth', label: 'Petições IA/mês', suffix: '/mês' },
  { key: 'maxProcessInterpretPerMonth', label: 'Interpretações IA/mês', suffix: '/mês' },
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

function fmtUnlimited(value: number, suffix = ''): React.ReactNode {
  if (value === -1) {
    return (
      <span className="inline-flex items-center gap-1">
        <InfinityIcon className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="sr-only">Ilimitado</span>
      </span>
    )
  }
  return `${value}${suffix}`
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanLimitData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<PlanLimitData>>({})
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const loadPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/billing/plans')
      if (!r.ok) throw new Error()
      const data = await r.json()
      setPlans((data.plans ?? []).map((p: { plan: string; limits: PlanLimitData }) => ({
        ...p.limits,
        plan: p.plan,
      })))
    } catch {
      setError('Erro ao carregar planos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlans() }, [])

  const handleEdit = (plan: PlanLimitData) => {
    setEditing(plan.plan)
    setEditData({ ...plan })
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/plans/${editing}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', title: `Plano ${editing} atualizado com sucesso.` })
      setEditing(null)
      await loadPlans()
    } catch {
      addToast({ type: 'error', title: 'Erro ao salvar plano.' })
    } finally {
      setSaving(false)
    }
  }

  const editingPlan = plans.find((p) => p.plan === editing)

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <PageHeader title="Planos" description="Gerencie os limites e features de cada plano" />

      {loading ? (
        <CardSkeleton count={3} />
      ) : error ? (
        <PageError title="Erro ao carregar planos" reset={loadPlans} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <AdminCard
              key={plan.plan}
              icon={Package}
              title={plan.plan}
              action={
                <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                  Editar
                </Button>
              }
            >
              <div className="space-y-3 text-sm">
                {NUMERIC_FIELDS.map(({ key, label, suffix }) => (
                  <div key={key} className="flex justify-between pb-2 border-b border-slate-100 last:border-b-0">
                    <span className="font-sans text-slate-500">{label}</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {fmtUnlimited(plan[key] as number, suffix)}
                    </span>
                  </div>
                ))}
                <div className="space-y-2 pt-2">
                  <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2">Features</p>
                  {BOOLEAN_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="font-sans text-slate-500">{label}</span>
                      {plan[key] ? (
                        <Check className="w-4 h-4 text-emerald-600" aria-label="Habilitado" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300" aria-label="Desabilitado" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Editar plano ${editing ?? ''}`}
        description="Limites numéricos e features habilitadas para este plano."
      >
        {editingPlan && (
          <div className="space-y-4">
            <div className="space-y-4">
              {NUMERIC_FIELDS.map(({ key, label, suffix }) => {
                const value = editData[key] as number | undefined
                const isUnlimited = value === -1
                return (
                  <div key={key}>
                    <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                      {label}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        value={isUnlimited ? '' : (value ?? '')}
                        disabled={isUnlimited}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value)
                          setEditData((d) => ({ ...d, [key]: val }))
                        }}
                        className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 transition-all"
                      />
                      <label className="flex items-center gap-1.5 text-xs font-sans text-slate-600 whitespace-nowrap cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isUnlimited}
                          onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.checked ? -1 : 0 }))}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        Ilimitado
                      </label>
                    </div>
                    {suffix && <p className="font-sans text-[10px] text-slate-400 mt-1">Unidade: {suffix}</p>}
                  </div>
                )
              })}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2">Features</p>
              {BOOLEAN_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editData[key])}
                    onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.checked }))}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-sans text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={handleSave} loading={saving} className="bg-amber-600 hover:bg-amber-700 flex-1">
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
    </ErrorBoundary>
  )
}
