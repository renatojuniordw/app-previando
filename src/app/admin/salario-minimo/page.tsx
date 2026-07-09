'use client'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { DatePicker } from '@/components/ui/DatePicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { useToast } from '@/store/toast'

interface SalarioMinimo {
  id: string
  vigencia: string
  valor: string | number
  teto: string | number
  legislacao: string
  reajuste: number | null
}

const fmt = (v: string | number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

const fmtDate = (d: string) => {
  const date = new Date(d)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

const EMPTY_FORM = { vigencia: '', valor: '', teto: '', legislacao: '', reajuste: '' }

export default function SalarioMinimoPage() {
  const [registros, setRegistros] = useState<SalarioMinimo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/admin/salario-minimo')
      if (!r.ok) throw new Error()
      const data = await r.json()
      setRegistros(data.registros ?? [])
    } catch {
      setError('Erro ao carregar registros.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    setFormError('')
    if (!form.vigencia || !form.valor || !form.teto || !form.legislacao) {
      setFormError('Preencha todos os campos obrigatórios.')
      return
    }
    setSaving(true)
    try {
      const body = {
        vigencia: form.vigencia,
        valor: parseFloat(form.valor.replace(',', '.')),
        teto: parseFloat(form.teto.replace(',', '.')),
        legislacao: form.legislacao,
        reajuste: form.reajuste ? parseFloat(form.reajuste.replace(',', '.')) : null,
      }
      const res = await fetch(editingId ? `/api/admin/salario-minimo/${editingId}` : '/api/admin/salario-minimo', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', title: editingId ? 'Registro atualizado.' : 'Registro criado.' })
      setForm(EMPTY_FORM)
      setShowForm(false)
      setEditingId(null)
      await load()
    } catch {
      setFormError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (r: SalarioMinimo) => {
    setEditingId(r.id)
    setForm({
      vigencia: r.vigencia.slice(0, 10),
      valor: String(Number(r.valor).toFixed(2)),
      teto: String(Number(r.teto).toFixed(2)),
      legislacao: r.legislacao,
      reajuste: r.reajuste !== null ? String(r.reajuste) : '',
    })
    setShowForm(true)
    setFormError('')
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/salario-minimo/${confirmDeleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', title: 'Registro excluído.' })
      setConfirmDeleteId(null)
      await load()
    } catch {
      addToast({ type: 'error', title: 'Erro ao excluir registro.' })
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditingId(null)
    setFormError('')
  }

  const columns: AdminTableColumn<SalarioMinimo & { _index: number }>[] = [
    {
      key: 'vigencia',
      header: 'Vigência',
      render: (r) => (
        <span className={`font-mono font-semibold text-sm ${r._index === 0 ? 'text-amber-700' : 'text-slate-800'}`}>
          {fmtDate(r.vigencia)}
          {r._index === 0 && (
            <span className="ml-2 font-sans text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">Vigente</span>
          )}
        </span>
      ),
    },
    { key: 'valor', header: 'Salário Mínimo', render: (r) => <span className="font-mono font-bold text-sm text-slate-900">{fmt(r.valor)}</span> },
    { key: 'teto', header: 'Teto RGPS', render: (r) => <span className="font-mono text-sm text-slate-600">{fmt(r.teto)}</span> },
    { key: 'legislacao', header: 'Legislação', render: (r) => <span className="font-sans text-xs text-slate-500">{r.legislacao}</span> },
    { key: 'reajuste', header: 'Reajuste', render: (r) => <span className="font-mono text-sm text-slate-500">{r.reajuste !== null ? `${r.reajuste.toFixed(2)}%` : '—'}</span> },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => handleEdit(r)}
            aria-label={`Editar registro de ${fmtDate(r.vigencia)}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(r.id)}
            aria-label={`Excluir registro de ${fmtDate(r.vigencia)}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <PageHeader
        title="Salário Mínimo"
        description="Tabela histórica usada nos cálculos previdenciários. O sistema busca o valor vigente na DIB."
        meta={`${registros.length} registros`}
        action={
          <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setFormError('') }} className="bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Novo Registro
          </Button>
        }
      />

      <AdminTable
        columns={columns}
        data={registros.map((r, i) => ({ ...r, _index: i }))}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyIcon={DollarSign}
        emptyTitle="Nenhum registro encontrado"
        emptyDescription="Cadastre o primeiro registro de salário mínimo."
      />

      <Drawer
        open={showForm}
        onClose={handleCancel}
        title={editingId ? 'Editar Registro' : 'Novo Registro'}
        description="Vigência histórica de salário mínimo e teto previdenciário."
      >
        <div className="space-y-4">
          <DatePicker
            label="Vigência (início) *"
            value={form.vigencia}
            onChange={(d) => setForm((f) => ({ ...f, vigencia: d ? d.toISOString().split('T')[0] : '' }))}
            disabled={!!editingId}
          />
          <CurrencyInput
            value={form.valor ? parseFloat(form.valor) : ''}
            onChange={(val) => setForm((f) => ({ ...f, valor: String(val) }))}
            label="Salário Mínimo (R$) *"
            placeholder="Ex: 1.621,00"
          />
          <CurrencyInput
            value={form.teto ? parseFloat(form.teto) : ''}
            onChange={(val) => setForm((f) => ({ ...f, teto: String(val) }))}
            label="Teto Previdenciário (R$) *"
            placeholder="Ex: 8.157,41"
          />
          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Legislação *</label>
            <input
              type="text"
              value={form.legislacao}
              onChange={(e) => setForm((f) => ({ ...f, legislacao: e.target.value }))}
              placeholder="Ex: Decreto 12.797/2025"
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Reajuste (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.reajuste}
              onChange={(e) => setForm((f) => ({ ...f, reajuste: e.target.value }))}
              placeholder="Ex: 6.79"
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>

          {formError && <p className="font-sans text-sm text-red-600" role="alert">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="primary" onClick={handleSubmit} loading={saving} className="bg-amber-600 hover:bg-amber-700 flex-1">
              Salvar
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este registro de salário mínimo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
      />
    </div>
    </ErrorBoundary>
  )
}
