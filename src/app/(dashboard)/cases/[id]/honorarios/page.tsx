'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import {
  DollarSign, Plus, Pencil, Trash2, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, AlertTriangle, TrendingUp,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Fee {
  id: string
  description: string
  totalAmount: number
  paidAmount: number
  dueDate: string | null
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  notes: string | null
  createdAt: string
}

interface Summary {
  total: number
  paid: number
  pending: number
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pendente', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  PARTIAL: { label: 'Parcial', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: TrendingUp },
  PAID: { label: 'Pago', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  OVERDUE: { label: 'Atrasado', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
  CANCELLED: { label: 'Cancelado', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', icon: XCircle },
}

const EMPTY_FORM = {
  description: '',
  totalAmount: '',
  paidAmount: '',
  dueDate: '',
  status: 'PENDING' as Fee['status'],
  notes: '',
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function HonorariosPage() {
  const { id } = useParams<{ id: string }>()
  const [fees, setFees] = useState<Fee[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/cases/${id}/fees`)
      .then((r) => { setFees(r.data.fees); setSummary(r.data.summary) })
      .catch((e) => setError(e?.response?.data?.error ?? 'Erro ao carregar honorários.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditingFee(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(fee: Fee) {
    setEditingFee(fee)
    setForm({
      description: fee.description,
      totalAmount: String(fee.totalAmount),
      paidAmount: String(fee.paidAmount),
      dueDate: fee.dueDate ? fee.dueDate.slice(0, 10) : '',
      status: fee.status,
      notes: fee.notes ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        description: form.description,
        totalAmount: parseFloat(form.totalAmount),
        paidAmount: parseFloat(form.paidAmount || '0'),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        status: form.status,
        notes: form.notes || null,
      }

      if (editingFee) {
        await api.put(`/cases/${id}/fees/${editingFee.id}`, payload)
      } else {
        await api.post(`/cases/${id}/fees`, payload)
      }

      setShowForm(false)
      load()
    } catch {
      // erro silencioso — toast seria ideal
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(feeId: string) {
    if (!confirm('Remover este honorário?')) return
    setDeletingId(feeId)
    try {
      await api.delete(`/cases/${id}/fees/${feeId}`)
      load()
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card variant="light" className="p-6 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Honorários</h2>
          <p className="text-sm text-slate-500 mt-1">Controle financeiro dos honorários deste caso</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Honorário
        </button>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total combinado', value: summary.total, color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Total recebido', value: summary.paid, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Total pendente', value: summary.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} variant="light" className={`p-5 border ${bg}`}>
            <div className="flex items-center gap-3">
              <DollarSign className={`w-5 h-5 ${color} opacity-60 shrink-0`} />
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`font-bold text-xl ${color}`}>{formatBRL(value)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lista */}
      {fees.length === 0 ? (
        <Card variant="light" className="p-8 text-center">
          <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhum honorário registrado ainda.</p>
          <button onClick={openCreate} className="mt-4 text-sm text-amber-600 font-semibold hover:underline">
            Registrar primeiro honorário
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {fees.map((fee) => {
            const cfg = STATUS_CONFIG[fee.status]
            const Icon = cfg.icon
            const progress = fee.totalAmount > 0 ? (fee.paidAmount / fee.totalAmount) * 100 : 0

            return (
              <Card key={fee.id} variant="light" className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="font-sans font-semibold text-slate-900 text-sm">{fee.description}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 mb-3">
                      <span>Total: <strong className="text-slate-700">{formatBRL(fee.totalAmount)}</strong></span>
                      <span>Recebido: <strong className="text-emerald-700">{formatBRL(fee.paidAmount)}</strong></span>
                      <span>Pendente: <strong className="text-amber-700">{formatBRL(fee.totalAmount - fee.paidAmount)}</strong></span>
                      {fee.dueDate && (
                        <span>Vence: <strong className="text-slate-700">{format(parseISO(fee.dueDate), 'dd/MM/yyyy')}</strong></span>
                      )}
                    </div>

                    {fee.totalAmount > 0 && (
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    )}

                    {fee.notes && (
                      <p className="text-xs text-slate-400 mt-2 italic">{fee.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(fee)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      disabled={deletingId === fee.id}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
                    >
                      {deletingId === fee.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <h3 className="font-serif font-bold text-lg text-slate-900">
              {editingFee ? 'Editar Honorário' : 'Novo Honorário'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Honorários iniciais, êxito, etc."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor total (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalAmount}
                    onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor recebido (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.paidAmount}
                    onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Fee['status'] }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.description || !form.totalAmount}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingFee ? 'Salvar' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
