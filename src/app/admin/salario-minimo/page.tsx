'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
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
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/salario-minimo')
    const data = await r.json()
    setRegistros(data.registros ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const handleSubmit = async () => {
    setError('')
    if (!form.vigencia || !form.valor || !form.teto || !form.legislacao) {
      setError('Preencha todos os campos obrigatórios.')
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
      if (editingId) {
        await fetch(`/api/admin/salario-minimo/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/salario-minimo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      setEditingId(null)
      await load()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
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
    setError('')
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Confirma a exclusão deste registro?')) return
    await fetch(`/api/admin/salario-minimo/${id}`, {
      method: 'DELETE',
    })
    await load()
  }
  const handleCancel = () => {
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditingId(null)
    setError('')
  }
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">Salário Mínimo</h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Tabela histórica usada nos cálculos previdenciários. O sistema busca o valor vigente na DIB.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError('') }}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-sans font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        )}
      </div>
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-lg text-slate-900">
            {editingId ? 'Editar Registro' : 'Novo Registro'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Vigência (início) *</label>
              <input
                type="date"
                value={form.vigencia}
                onChange={e => setForm(f => ({ ...f, vigencia: e.target.value }))}
                disabled={!!editingId}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Salário Mínimo (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                placeholder="Ex: 1621.00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Teto Previdenciário (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={form.teto}
                onChange={e => setForm(f => ({ ...f, teto: e.target.value }))}
                placeholder="Ex: 8157.41"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Legislação *</label>
              <input
                type="text"
                value={form.legislacao}
                onChange={e => setForm(f => ({ ...f, legislacao: e.target.value }))}
                placeholder="Ex: Decreto 12.797/2025"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Reajuste (%)</label>
              <input
                type="number"
                step="0.01"
                value={form.reajuste}
                onChange={e => setForm(f => ({ ...f, reajuste: e.target.value }))}
                placeholder="Ex: 6.79"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
          </div>
          {error && <p className="font-sans text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-sans font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_0.8fr_auto] px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Vigência</span>
          <span>Salário Mínimo</span>
          <span>Teto RGPS</span>
          <span>Legislação</span>
          <span>Reajuste</span>
          <span></span>
        </div>
        {loading ? (
          <div className="py-12 text-center font-sans text-sm text-slate-400">Carregando...</div>
        ) : registros.length === 0 ? (
          <div className="py-12 text-center font-sans text-sm text-slate-400">Nenhum registro encontrado.</div>
        ) : (
          registros.map((r, i) => (
            <div
              key={r.id}
              className={`grid grid-cols-[1fr_1fr_1fr_1.5fr_0.8fr_auto] px-5 py-4 items-center text-sm font-sans ${i === 0 ? 'bg-amber-50 border-b border-amber-100' : 'border-b border-slate-100 last:border-0'}`}
            >
              <span className={`font-semibold ${i === 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                {fmtDate(r.vigencia)}
                {i === 0 && <span className="ml-2 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">Vigente</span>}
              </span>
              <span className="font-bold text-slate-900">{fmt(r.valor)}</span>
              <span className="text-slate-600">{fmt(r.teto)}</span>
              <span className="text-slate-500 text-xs truncate pr-2">{r.legislacao}</span>
              <span className="text-slate-500">
                {r.reajuste !== null ? `${r.reajuste?.toFixed(2)}%` : '—'}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(r)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="font-sans text-xs text-slate-400">
        Total: {registros.length} registros · O sistema sempre usa o registro com vigência mais recente anterior à DIB do cálculo.
      </p>
    </div>
  )
}
