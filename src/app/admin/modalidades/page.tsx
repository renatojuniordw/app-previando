'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { useToast } from '@/store/toast'

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
      const r = await fetch('/api/admin/modalidades')
      if (!r.ok) throw new Error()
      const data = await r.json()
      setModalidades(data.modalidades ?? [])
    } catch {
      setError('Erro ao carregar modalidades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    setFormError('')
    if (!form.codigo.trim() || !form.label.trim()) {
      setFormError('Preencha os campos obrigatórios: código e nome de exibição.')
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
      const res = await fetch(editingId ? `/api/admin/modalidades/${editingId}` : '/api/admin/modalidades', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', title: editingId ? 'Modalidade atualizada.' : 'Modalidade criada.' })
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
    setFormError('')
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/modalidades/${confirmDeleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', title: 'Modalidade excluída.' })
      setConfirmDeleteId(null)
      await load()
    } catch {
      addToast({ type: 'error', title: 'Erro ao excluir modalidade.' })
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

  const columns: AdminTableColumn<Modalidade>[] = [
    { key: 'codigo', header: 'Código', render: (m) => <span className="font-mono font-semibold text-sm text-slate-800">{m.codigo}</span> },
    { key: 'label', header: 'Nome exibido', render: (m) => <span className="font-sans text-sm text-slate-700">{m.label}</span> },
    { key: 'ordem', header: 'Ordem', render: (m) => <span className="font-mono text-sm text-slate-600">{m.ordem}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span className={`font-sans text-xs font-bold px-2 py-0.5 rounded w-fit ${m.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {m.ativo ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
    { key: 'descricao', header: 'Descrição', render: (m) => <span className="font-sans text-xs text-slate-500">{m.descricao || '—'}</span> },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (m) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => handleEdit(m)}
            aria-label={`Editar modalidade ${m.label}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={() => m.id && setConfirmDeleteId(m.id)}
            disabled={!m.id}
            aria-label={`Excluir modalidade ${m.label}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modalidades"
        description="Tabela-base das modalidades exibidas em cálculos, simulações e regras previdenciárias."
        meta={`${modalidades.length} modalidades`}
        action={
          <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setFormError('') }} className="bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nova Modalidade
          </Button>
        }
      />

      <AdminTable
        columns={columns}
        data={modalidades}
        rowKey={(m) => m.id ?? m.codigo}
        loading={loading}
        error={error}
        onRetry={load}
        emptyIcon={Tags}
        emptyTitle="Nenhuma modalidade cadastrada"
        emptyDescription="Cadastre a primeira modalidade previdenciária."
      />

      <p className="font-sans text-xs text-slate-400">
        O app usa esta tabela para montar selects e exibir nomes legíveis das modalidades. Inative uma modalidade para escondê-la do uso diário sem perder o histórico.
      </p>

      <Drawer
        open={showForm}
        onClose={handleCancel}
        title={editingId ? 'Editar Modalidade' : 'Nova Modalidade'}
        description="Modalidades usadas em cálculos, simulações e regras previdenciárias."
      >
        <div className="space-y-4">
          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Código *</label>
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
              disabled={!!editingId}
              placeholder="Ex: APOSENTADORIA_IDADE"
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 transition-all"
            />
          </div>
          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Nome exibido *</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ex: Aposentadoria por Idade"
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Ordem</label>
            <input
              type="number"
              min="0"
              value={form.ordem}
              onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))}
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Descrição interna</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Opcional. Útil para contextualizar a modalidade no admin."
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-sans text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            Modalidade ativa
          </label>

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
        title="Excluir Modalidade"
        message="Tem certeza que deseja excluir esta modalidade? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
