'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Button } from '@/components/ui/Button'
import {
  DollarSign, Plus, Pencil, Trash2, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, AlertTriangle, TrendingUp,
  Wallet, Ban, Receipt, Undo2, RotateCcw,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { DatePicker } from '@/components/ui/DatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/store/toast'
import { format, parseISO } from 'date-fns'
import { formatCurrency, cn } from '@/lib/utils'

function extractErrorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

type FeeType = 'FIXED' | 'CONTINGENCY' | 'PERCENTAGE' | 'OTHER'

interface FeePayment {
  id: string
  amount: number
  paidAt: string
  notes: string | null
}

interface Fee {
  id: string
  description: string
  type: FeeType
  totalAmount: number
  paidAmount: number
  dueDate: string | null
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  notes: string | null
  createdAt: string
  payments: FeePayment[]
}

interface Summary {
  total: number
  paid: number
  pending: number
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Pendente',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock },
  PARTIAL:   { label: 'Parcial',    color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: TrendingUp },
  PAID:      { label: 'Pago',       color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  OVERDUE:   { label: 'Atrasado',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertTriangle },
  CANCELLED: { label: 'Cancelado',  color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-200',   icon: XCircle },
}

const TYPE_LABELS: Record<FeeType, string> = {
  FIXED: 'Fixo',
  CONTINGENCY: 'Êxito',
  PERCENTAGE: 'Percentual sobre a causa',
  OTHER: 'Outro',
}

const EMPTY_FORM = {
  description: '',
  type: 'FIXED' as FeeType,
  totalAmount: '',
  dueDate: '',
  notes: '',
}

const EMPTY_PAYMENT_FORM = {
  amount: '',
  paidAt: new Date().toISOString().split('T')[0],
  notes: '',
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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [payingFee, setPayingFee] = useState<Fee | null>(null)
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM)
  const [savingPayment, setSavingPayment] = useState(false)
  const [removingPaymentId, setRemovingPaymentId] = useState<string | null>(null)
  const { addToast } = useToast()

  const isFormDirty = form.description !== '' || form.totalAmount !== ''
  const isPaymentDirty = paymentForm.amount !== ''

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
      type: fee.type,
      totalAmount: String(fee.totalAmount),
      dueDate: fee.dueDate ? fee.dueDate.slice(0, 10) : '',
      notes: fee.notes ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        description: form.description,
        type: form.type,
        totalAmount: parseFloat(form.totalAmount),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        notes: form.notes || null,
      }
      if (editingFee) {
        await api.put(`/cases/${id}/fees/${editingFee.id}`, payload)
      } else {
        await api.post(`/cases/${id}/fees`, payload)
      }
      setShowForm(false)
      setEditingFee(null)
      setForm(EMPTY_FORM)
      load()
      addToast({ type: 'success', title: editingFee ? 'Honorário atualizado' : 'Honorário registrado' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erro', message: extractErrorMessage(e, 'Não foi possível salvar o honorário.') })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleCancelled(fee: Fee) {
    try {
      await api.put(`/cases/${id}/fees/${fee.id}`, { cancelled: fee.status !== 'CANCELLED' })
      load()
      addToast({
        type: 'success',
        title: fee.status === 'CANCELLED' ? 'Honorário reativado' : 'Honorário cancelado',
      })
    } catch {
      addToast({ type: 'error', title: 'Erro ao atualizar honorário' })
    }
  }

  function handleDelete(feeId: string) {
    setConfirmDelete(feeId)
  }

  async function confirmDeleteFee() {
    if (!confirmDelete) return
    const feeId = confirmDelete
    setConfirmDelete(null)
    setDeletingId(feeId)
    try {
      await api.delete(`/cases/${id}/fees/${feeId}`)
      addToast({ type: 'success', title: 'Honorário removido' })
      load()
    } catch {
      addToast({ type: 'error', title: 'Erro ao remover honorário' })
    } finally {
      setDeletingId(null)
    }
  }

  function openPayment(fee: Fee) {
    setPayingFee(fee)
    setPaymentForm(EMPTY_PAYMENT_FORM)
  }

  async function handleSavePayment() {
    if (!payingFee) return
    setSavingPayment(true)
    try {
      await api.post(`/cases/${id}/fees/${payingFee.id}/payments`, {
        amount: parseFloat(paymentForm.amount),
        paidAt: paymentForm.paidAt ? new Date(paymentForm.paidAt).toISOString() : undefined,
        notes: paymentForm.notes || null,
      })
      setPayingFee(null)
      setPaymentForm(EMPTY_PAYMENT_FORM)
      load()
      addToast({ type: 'success', title: 'Pagamento registrado' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erro', message: extractErrorMessage(e, 'Não foi possível registrar o pagamento.') })
    } finally {
      setSavingPayment(false)
    }
  }

  async function handleRemovePayment(feeId: string, paymentId: string) {
    setRemovingPaymentId(paymentId)
    try {
      await api.delete(`/cases/${id}/fees/${feeId}/payments/${paymentId}`)
      load()
      addToast({ type: 'success', title: 'Pagamento removido' })
    } catch {
      addToast({ type: 'error', title: 'Erro ao remover pagamento' })
    } finally {
      setRemovingPaymentId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-48 h-8" />
            <Skeleton variant="text" className="w-72 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-2xl border border-slate-200/80">
          <Skeleton variant="rectangular" className="h-24" count={3} />
        </div>
        <Skeleton variant="card" className="h-32" count={2} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-0">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <AlertCircle className="h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="font-sans text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-0">

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">Honorários</h1>
          <p className="mt-1 font-sans text-sm text-slate-500">
            Controle financeiro dos honorários e recebimentos deste caso.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="flex items-center gap-2 bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Novo Honorário
        </Button>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:grid-cols-3">
        <SummaryCell
          label="Total Combinado"
          value={summary.total}
          icon={<Wallet className="h-4 w-4 text-slate-400" />}
          border="right"
        />
        <SummaryCell
          label="Total Recebido"
          value={summary.paid}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          valueColor="text-emerald-700"
          highlight="emerald"
          border="right"
        />
        <SummaryCell
          label="Total Pendente"
          value={summary.pending}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          valueColor="text-amber-700"
          highlight="amber"
        />
      </div>

      {/* Empty State */}
      {fees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 shadow-sm">
            <DollarSign className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mb-2 font-serif text-lg font-bold text-slate-900">
            Nenhum Honorário Registrado
          </h2>
          <p className="mx-auto mb-7 max-w-sm font-sans text-sm leading-relaxed text-slate-500">
            Registre os honorários combinados com o cliente e acompanhe recebimentos e pendências.
          </p>
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 bg-amber-600 text-white shadow-sm hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Registrar Primeiro Honorário
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...fees].sort((a, b) => {
            const statusOrder: Record<string, number> = { OVERDUE: 0, PENDING: 1, PARTIAL: 2, PAID: 3, CANCELLED: 4 }
            const aOrder = statusOrder[a.status] ?? 99
            const bOrder = statusOrder[b.status] ?? 99
            if (aOrder !== bOrder) return aOrder - bOrder
            if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }).map((fee) => {
            const cfg = STATUS_CONFIG[fee.status]
            const Icon = cfg.icon
            const progress = fee.totalAmount > 0 ? (fee.paidAmount / fee.totalAmount) * 100 : 0
            const pendente = fee.totalAmount - fee.paidAmount
            const cancelled = fee.status === 'CANCELLED'
            const settled = fee.status === 'PAID' || cancelled

            return (
              <div
                key={fee.id}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300',
                  cancelled
                    ? 'border-dashed border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                )}
              >
                {/* Status stripe */}
                <div className={cn(
                  'h-1 w-full',
                  fee.status === 'PAID' ? 'bg-emerald-400' :
                  fee.status === 'OVERDUE' ? 'bg-red-400' :
                  fee.status === 'CANCELLED' ? 'bg-slate-300' :
                  'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
                )} />

                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  {/* Content */}
                  <div className={cn('min-w-0 flex-1 space-y-3', cancelled && 'opacity-60')}>
                    {/* Title + Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={cn(
                        'font-sans text-sm font-bold text-slate-900',
                        cancelled && 'line-through decoration-slate-400'
                      )}>
                        {fee.description}
                      </h2>
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        {TYPE_LABELS[fee.type]}
                      </span>
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
                        cfg.bg, cfg.color, cfg.border
                      )}>
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Financial metadata */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-sans text-xs">
                      <span className="text-slate-500">
                        Total:{' '}
                        <span className="font-mono font-bold text-slate-800">
                          {formatCurrency(fee.totalAmount)}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        Recebido:{' '}
                        <span className="font-mono font-bold text-emerald-700">
                          {formatCurrency(fee.paidAmount)}
                        </span>
                      </span>
                      {pendente > 0 && !cancelled && (
                        <span className="text-slate-500">
                          Pendente:{' '}
                          <span className="font-mono font-bold text-amber-700">
                            {formatCurrency(pendente)}
                          </span>
                        </span>
                      )}
                      {fee.dueDate && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
                          Vence:{' '}
                          <span className="font-mono font-bold text-slate-700">
                            {format(parseISO(fee.dueDate), 'dd/MM/yyyy')}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {fee.totalAmount > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              progress >= 100 ? 'bg-emerald-500' :
                              progress >= 50 ? 'bg-emerald-400' : 'bg-amber-400'
                            )}
                            style={{ width: `${Math.min(100, progress)}%` }}
                            role="progressbar"
                            aria-valuenow={Math.round(progress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${Math.round(progress)}% recebido`}
                          />
                        </div>
                        <p className="font-sans text-[10px] text-slate-400">
                          {Math.round(progress)}% recebido
                        </p>
                      </div>
                    )}

                    {/* Payment history */}
                    {fee.payments.length > 0 && (
                      <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                        {fee.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between gap-2 font-sans text-xs">
                            <span className="text-slate-500">
                              {format(parseISO(p.paidAt), 'dd/MM/yyyy')}
                              {p.notes && <span className="italic text-slate-400"> — {p.notes}</span>}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="font-mono font-bold text-emerald-700">
                                {formatCurrency(p.amount)}
                              </span>
                              <button
                                onClick={() => handleRemovePayment(fee.id, p.id)}
                                disabled={removingPaymentId === p.id}
                                className="text-slate-300 transition-colors hover:text-red-500 disabled:opacity-50"
                                aria-label="Remover pagamento"
                              >
                                {removingPaymentId === p.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                  : <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                                }
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {fee.notes && (
                      <p className="font-sans text-xs italic text-slate-400 leading-relaxed">
                        {fee.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 self-start">
                    {!settled && (
                      <button
                        onClick={() => openPayment(fee)}
                        className="rounded-lg border border-emerald-200 p-2 text-emerald-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-label={`Registrar pagamento: ${fee.description}`}
                        title="Registrar pagamento"
                      >
                        <Receipt className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(fee)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      aria-label={`Editar honorário: ${fee.description}`}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleToggleCancelled(fee)}
                      className={cn(
                        'rounded-lg border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2',
                        cancelled
                          ? 'border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 focus-visible:ring-emerald-500'
                          : 'border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-400'
                      )}
                      aria-label={cancelled ? `Reativar honorário: ${fee.description}` : `Cancelar honorário: ${fee.description}`}
                      title={cancelled ? 'Reativar honorário' : 'Cancelar honorário'}
                    >
                      {cancelled
                        ? <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        : <Ban className="h-4 w-4" aria-hidden="true" />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      disabled={deletingId === fee.id}
                      className="rounded-lg border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
                      aria-label={`Remover honorário: ${fee.description}`}
                      title="Excluir"
                    >
                      {deletingId === fee.id
                        ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        : <Trash2 className="h-4 w-4" aria-hidden="true" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal — Formulário de Honorário */}
      <Modal
        open={showForm}
        onClose={() => {
          if (isFormDirty && !window.confirm('Há alterações não salvas. Deseja realmente sair?')) return
          setShowForm(false)
        }}
        title={editingFee ? 'Editar Honorário' : 'Novo Honorário'}
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="fee-description" className="neo-label">Descrição</label>
            <input
              id="fee-description"
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Honorários iniciais, êxito, etc."
              className="neo-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fee-type" className="neo-label">Tipo de honorário</label>
              <select
                id="fee-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FeeType }))}
                className="neo-input"
              >
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <CurrencyInput
              value={form.totalAmount ? parseFloat(form.totalAmount) : ''}
              onChange={(val) => setForm((f) => ({ ...f, totalAmount: String(val) }))}
              label="Valor total (R$)"
              placeholder="0,00"
              min={editingFee ? editingFee.paidAmount : 0}
              hint={editingFee && editingFee.paidAmount > 0 ? `Não pode ser menor que o já recebido (${formatCurrency(editingFee.paidAmount)})` : undefined}
            />
          </div>

          <DatePicker
            label="Vencimento"
            value={form.dueDate}
            onChange={(d) => setForm((f) => ({ ...f, dueDate: d ? d.toISOString().split('T')[0] : '' }))}
          />

          <div>
            <label htmlFor="fee-notes" className="neo-label">Observações</label>
            <textarea
              id="fee-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="neo-input resize-none"
              placeholder="Informações adicionais sobre este honorário..."
            />
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={saving || !form.description || !form.totalAmount}
              className="flex-1 bg-amber-600 font-semibold text-white hover:bg-amber-700"
            >
              {editingFee ? 'Salvar Alterações' : 'Registrar Honorário'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal — Registrar Pagamento */}
      <Modal
        open={payingFee !== null}
        onClose={() => {
          if (isPaymentDirty && !window.confirm('Há alterações não salvas. Deseja realmente sair?')) return
          setPayingFee(null)
        }}
        title="Registrar Pagamento"
        size="sm"
      >
        {payingFee && (
          <div className="space-y-5">
            <p className="font-sans text-sm text-slate-500">
              {payingFee.description} — saldo pendente{' '}
              <span className="font-mono font-bold text-amber-700">
                {formatCurrency(payingFee.totalAmount - payingFee.paidAmount)}
              </span>
            </p>

            <CurrencyInput
              value={paymentForm.amount ? parseFloat(paymentForm.amount) : ''}
              onChange={(val) => setPaymentForm((f) => ({ ...f, amount: String(val) }))}
              label="Valor pago (R$)"
              placeholder="0,00"
              max={payingFee.totalAmount - payingFee.paidAmount}
            />

            <DatePicker
              label="Data do pagamento"
              value={paymentForm.paidAt}
              onChange={(d) => setPaymentForm((f) => ({ ...f, paidAt: d ? d.toISOString().split('T')[0] : '' }))}
            />

            <div>
              <label htmlFor="payment-notes" className="neo-label">Observações</label>
              <input
                id="payment-notes"
                type="text"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: Pix, boleto, transferência..."
                className="neo-input"
              />
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <Button
                onClick={handleSavePayment}
                loading={savingPayment}
                disabled={savingPayment || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
                className="flex-1 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
              >
                Registrar Pagamento
              </Button>
              <Button
                variant="outline"
                onClick={() => setPayingFee(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ConfirmDialog — Exclusão */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onConfirm={confirmDeleteFee}
        onCancel={() => setConfirmDelete(null)}
        title="Remover honorário?"
        message="Tem certeza que deseja remover este honorário? Esta ação não pode ser desfeita e todos os pagamentos registrados serão perdidos."
        confirmLabel="Sim, Remover"
        variant="danger"
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCell({
  label,
  value,
  icon,
  valueColor = 'text-slate-900',
  highlight,
  border,
}: {
  label: string
  value: number
  icon: React.ReactNode
  valueColor?: string
  highlight?: 'emerald' | 'amber'
  border?: 'right'
}) {
  return (
    <div className={cn(
      'flex flex-col gap-1 p-5',
      highlight === 'emerald' && 'bg-emerald-50/20',
      highlight === 'amber' && 'bg-amber-50/20',
      border === 'right' && 'border-b border-slate-100 sm:border-b-0 sm:border-r'
    )}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <span className={cn('font-mono text-xl font-bold tracking-tight', valueColor)}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
