'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
interface Modalidade {
  id?: string
  codigo: string
  label: string
  descricao?: string | null
  ativo: boolean
  ordem: number
}
const EMPTY_FORM = {
  codigo: '',
  label: '',
  descricao: '',
  ativo: true,
  ordem: '0',
}
export default function ModalidadesPage() {
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/modalidades')
    const data = await r.json()
    setModalidades(data.modalidades ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const handleSubmit = async () => {
    setError('')
    if (!form.codigo.trim() || !form.label.trim()) {
      setError('Preencha os campos obrigatórios: código e nome de exibição.')
      return
    }
    setSaving(true)
    try {
      const body = {
        codigo: form.codigo.trim().toUpperCase(),
        label: form.label.trim(),
        descricao: form.descricao.trim() || null,
        ativo: form.ativo,
        ordem: Number(form.ordem || 0),
      }
      if (editingId) {
        await fetch(`/api/admin/modalidades/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/modalidades', {
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
  const handleEdit = (modalidade: Modalidade) => {
    setEditingId(modalidade.id ?? null)
    setForm({
      codigo: modalidade.codigo,
      label: modalidade.label,
      descricao: modalidade.descricao ?? '',
      ativo: modalidade.ativo,
      ordem: String(modalidade.ordem),
    })
    setShowForm(true)
    setError('')
  }
  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Confirma a exclusão desta modalidade?')) return
    await fetch(`/api/admin/modalidades/${id}`, {
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
      <div className="flex align-items-center justify-content-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">Modalidades</h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Tabela-base das modalidades exibidas em cálculos, simulações e regras previdenciárias.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError('') }}
            className="flex align-items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-sans font-semibold text-sm px-4 py-2.5 rounded-lg neo-btn transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Modalidade
          </button>
        )}
      </div>
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 neo-card-flat">
          <h2 className="font-serif font-bold text-lg text-slate-900">
            {editingId ? 'Editar Modalidade' : 'Nova Modalidade'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Código *</label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                disabled={!!editingId}
                placeholder="Ex: APOSENTADORIA_IDADE"
                className="w-full neo-input-neo rounded-md px-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Nome exibido *</label>
              <input
                type="text"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Ex: Aposentadoria por Idade"
                className="w-full neo-input-neo rounded-md px-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 outline-none"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Ordem</label>
              <input
                type="number"
                min="0"
                value={form.ordem}
                onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))}
                className="w-full neo-input-neo rounded-md px-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Descrição interna</label>
              <input
                type="text"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Opcional. Útil para contextualizar a modalidade no admin."
                className="w-full neo-input-neo rounded-md px-3 py-2 text-sm font-sans focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 outline-none"
              />
            </div>
            <label className="flex align-items-center gap-2 text-sm font-sans text-slate-700">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              Modalidade ativa
            </label>
          </div>
          {error && <p className="font-sans text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex align-items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white font-sans font-semibold text-sm px-4 py-2.5 rounded-lg neo-btn transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={handleCancel}
              className="flex align-items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold text-sm px-4 py-2.5 rounded-lg neo-btn transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden neo-card-flat">
        <div className="grid grid-cols-[1.1fr_1.5fr_0.7fr_0.7fr_1fr_auto] px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Código</span>
          <span>Nome exibido</span>
          <span>Ordem</span>
          <span>Status</span>
          <span>Descrição</span>
          <span></span>
        </div>
        {loading ? (
          <div className="py-12 text-center font-sans text-sm text-slate-400">Carregando...</div>
        ) : modalidades.length === 0 ? (
          <div className="py-12 text-center font-sans text-sm text-slate-400">Nenhuma modalidade cadastrada.</div>
        ) : (
          modalidades.map((modalidade) => (
            <div
              key={modalidade.id ?? modalidade.codigo}
              className="grid grid-cols-[1.1fr_1.5fr_0.7fr_0.7fr_1fr_auto] px-5 py-4 align-items-center text-sm font-sans border-b border-slate-100 last:border-0"
            >
              <span className="font-semibold text-slate-800">{modalidade.codigo}</span>
              <span className="text-slate-700">{modalidade.label}</span>
              <span className="text-slate-600">{modalidade.ordem}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded w-fit ${modalidade.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {modalidade.ativo ? 'Ativa' : 'Inativa'}
              </span>
              <span className="text-slate-500 text-xs pr-2">{modalidade.descricao || '—'}</span>
              <div className="flex gap-1 justify-content-end">
                <button
                  onClick={() => handleEdit(modalidade)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-tint)] transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(modalidade.id)}
                  disabled={!modalidade.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
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
        O app usa esta tabela para montar selects e exibir nomes legíveis das modalidades. Inative uma modalidade para escondê-la do uso diário sem perder o histórico.
      </p>
    </div>
  )
}
