'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { DatePicker } from '@/components/ui/DatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { PageError } from '@/components/ui/PageError'
import { useToast } from '@/store/toast'

interface RegraAposentadoria {
  id: string
  modalidade: string
  genero: string
  vigencia: string
  idadeMinima: string | number | null
  tempoContribuicaoAnos: number | null
  pontosMinimos: number | null
  carenciaMeses: number | null
  descricao: string
  legislacao: string
  observacoes: string | null
}

interface Modalidade {
  codigo: string
  label: string
}

const GENERO_LABELS: Record<string, string> = {
  M: 'Homens',
  F: 'Mulheres',
  AMBOS: 'Ambos',
}

const EMPTY_FORM = {
  modalidade: '',
  genero: 'M',
  vigencia: '',
  idadeMinima: '',
  tempoContribuicaoAnos: '',
  pontosMinimos: '',
  carenciaMeses: '',
  descricao: '',
  legislacao: '',
  observacoes: '',
}

const fmtDate = (d: string) => {
  const date = new Date(d)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function groupByModalidade(registros: RegraAposentadoria[]) {
  const map: Record<string, RegraAposentadoria[]> = {}
  for (const r of registros) {
    if (!map[r.modalidade]) map[r.modalidade] = []
    map[r.modalidade].push(r)
  }
  return map
}

export default function RegrasAposentadoriaPage() {
  const [registros, setRegistros] = useState<RegraAposentadoria[]>([])
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const { addToast } = useToast()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [regrasResponse, modalidadesResponse] = await Promise.all([
        fetch('/api/admin/regras-aposentadoria'),
        fetch('/api/admin/modalidades'),
      ])
      if (!regrasResponse.ok || !modalidadesResponse.ok) throw new Error()
      const regrasData = await regrasResponse.json()
      const modalidadesData = await modalidadesResponse.json()
      setRegistros(regrasData.registros ?? [])
      setModalidades((modalidadesData.modalidades ?? []).filter((item: Modalidade & { ativo: boolean }) => item.ativo))
    } catch {
      setError('Erro ao carregar regras de aposentadoria.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleGroup = (modalidade: string) => {
    setExpandedGroups((prev) => ({ ...prev, [modalidade]: !prev[modalidade] }))
  }

  const parseNum = (v: string) => (v.trim() === '' ? null : parseFloat(v.replace(',', '.')))
  const parseIntVal = (v: string) => (v.trim() === '' ? null : window.parseInt(v, 10))

  const handleSubmit = async () => {
    setFormError('')
    if (!form.modalidade || !form.genero || !form.vigencia || !form.descricao || !form.legislacao) {
      setFormError('Preencha os campos obrigatórios: modalidade, gênero, vigência, descrição e legislação.')
      return
    }
    setSaving(true)
    try {
      const body = {
        modalidade: form.modalidade,
        genero: form.genero,
        vigencia: form.vigencia,
        idadeMinima: parseNum(form.idadeMinima),
        tempoContribuicaoAnos: parseIntVal(form.tempoContribuicaoAnos),
        pontosMinimos: parseIntVal(form.pontosMinimos),
        carenciaMeses: parseIntVal(form.carenciaMeses),
        descricao: form.descricao,
        legislacao: form.legislacao,
        observacoes: form.observacoes || null,
      }
      const res = await fetch(editingId ? `/api/admin/regras-aposentadoria/${editingId}` : '/api/admin/regras-aposentadoria', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', title: editingId ? 'Regra atualizada.' : 'Regra criada.' })
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

  const handleEdit = (r: RegraAposentadoria) => {
    setEditingId(r.id)
    setForm({
      modalidade: r.modalidade,
      genero: r.genero,
      vigencia: r.vigencia.slice(0, 10),
      idadeMinima: r.idadeMinima !== null ? String(Number(r.idadeMinima).toFixed(1)) : '',
      tempoContribuicaoAnos: r.tempoContribuicaoAnos !== null ? String(r.tempoContribuicaoAnos) : '',
      pontosMinimos: r.pontosMinimos !== null ? String(r.pontosMinimos) : '',
      carenciaMeses: r.carenciaMeses !== null ? String(r.carenciaMeses) : '',
      descricao: r.descricao,
      legislacao: r.legislacao,
      observacoes: r.observacoes ?? '',
    })
    setShowForm(true)
    setFormError('')
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/regras-aposentadoria/${confirmDeleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', title: 'Regra excluída.' })
      setConfirmDeleteId(null)
      await load()
    } catch {
      addToast({ type: 'error', title: 'Erro ao excluir regra.' })
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

  const grouped = groupByModalidade(registros)
  const modalidadeLabels = Object.fromEntries(modalidades.map(({ codigo, label }) => [codigo, label]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regras de Aposentadoria"
        description="Parâmetros das modalidades de cálculo. O engine sempre usa a regra com vigência mais recente anterior à DIB."
        meta={`${registros.length} registros`}
        action={
          <Button variant="primary" size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setFormError('') }} className="bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nova Regra
          </Button>
        }
      />

      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
          <TableSkeleton rows={4} columns={6} />
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <PageError title="Erro ao carregar regras" reset={load} />
        </div>
      ) : registros.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <EmptyState icon={BookOpen} title="Nenhuma regra cadastrada" description='Clique em "Nova Regra" para começar.' />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([modalidade, regs]) => {
            const isExpanded = expandedGroups[modalidade] !== false
            const label = modalidadeLabels[modalidade] ?? modalidade
            return (
              <div key={modalidade} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleGroup(modalidade)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif font-bold text-sm text-slate-900">{label}</h2>
                    <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                      {modalidade}
                    </span>
                    <span className="font-sans text-xs text-slate-400">{regs.length} registro{regs.length !== 1 ? 's' : ''}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gênero</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Descrição</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Idade Mín.</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tempo Contrib.</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pontos</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Carência</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Legislação</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Vigência</th>
                          <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regs.map((r, i) => (
                          <tr key={r.id} className={`border-t border-slate-100 text-sm ${i === 0 ? 'bg-amber-50/60' : ''}`}>
                            <td className="px-5 py-3.5">
                              <span className={`font-sans font-semibold text-xs px-2 py-0.5 rounded w-fit ${r.genero === 'M' ? 'bg-blue-100 text-blue-700' : r.genero === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600'}`}>
                                {GENERO_LABELS[r.genero] ?? r.genero}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-sans text-slate-700 text-xs">{r.descricao}</td>
                            <td className="px-5 py-3.5 font-mono text-slate-600">{r.idadeMinima !== null ? `${Number(r.idadeMinima)} anos` : '—'}</td>
                            <td className="px-5 py-3.5 font-mono text-slate-600">{r.tempoContribuicaoAnos !== null ? `${r.tempoContribuicaoAnos} anos` : '—'}</td>
                            <td className="px-5 py-3.5 font-mono text-slate-600">{r.pontosMinimos ?? '—'}</td>
                            <td className="px-5 py-3.5 font-mono text-slate-600">{r.carenciaMeses !== null ? `${r.carenciaMeses} m` : '—'}</td>
                            <td className="px-5 py-3.5 font-sans text-slate-500 text-xs">{r.legislacao}</td>
                            <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">
                              {fmtDate(r.vigencia)}
                              {i === 0 && <span className="ml-1 font-sans text-[9px] bg-amber-500 text-white px-1 py-0.5 rounded font-bold uppercase">Vigente</span>}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => handleEdit(r)}
                                  aria-label={`Editar regra ${r.descricao}`}
                                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                >
                                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(r.id)}
                                  aria-label={`Excluir regra ${r.descricao}`}
                                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="font-sans text-xs text-slate-400">
        Para atualizar uma regra, adicione um novo registro com a mesma modalidade/gênero e uma vigência futura.
      </p>

      <Drawer
        open={showForm}
        onClose={handleCancel}
        title={editingId ? 'Editar Regra' : 'Nova Regra'}
        description="Parâmetros de elegibilidade usados pelo motor de cálculo previdenciário."
        className="max-w-xl md:max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Modalidade *</label>
              <select
                value={form.modalidade}
                onChange={(e) => setForm((f) => ({ ...f, modalidade: e.target.value }))}
                disabled={!!editingId}
                className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 transition-all"
              >
                <option value="">Selecione...</option>
                {modalidades.map((modalidade) => (
                  <option key={modalidade.codigo} value={modalidade.codigo}>{modalidade.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Gênero *</label>
              <select
                value={form.genero}
                onChange={(e) => setForm((f) => ({ ...f, genero: e.target.value }))}
                disabled={!!editingId}
                className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 transition-all"
              >
                <option value="M">Homens (M)</option>
                <option value="F">Mulheres (F)</option>
                <option value="AMBOS">Ambos</option>
              </select>
            </div>
          </div>

          <DatePicker
            label="Vigência (início) *"
            value={form.vigencia}
            onChange={(d) => setForm((f) => ({ ...f, vigencia: d ? d.toISOString().split('T')[0] : '' }))}
            disabled={!!editingId}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Idade Mínima (anos)</label>
              <input
                type="number"
                step="0.5"
                value={form.idadeMinima}
                onChange={(e) => setForm((f) => ({ ...f, idadeMinima: e.target.value }))}
                placeholder="Ex: 62 ou 59.5"
                className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Tempo Contrib. (anos)</label>
              <input
                type="number"
                step="1"
                value={form.tempoContribuicaoAnos}
                onChange={(e) => setForm((f) => ({ ...f, tempoContribuicaoAnos: e.target.value }))}
                placeholder="Ex: 35"
                className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Pontos Mínimos</label>
              <input
                type="number"
                step="1"
                value={form.pontosMinimos}
                onChange={(e) => setForm((f) => ({ ...f, pontosMinimos: e.target.value }))}
                placeholder="Ex: 103"
                className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Carência (meses)</label>
            <input
              type="number"
              step="1"
              value={form.carenciaMeses}
              onChange={(e) => setForm((f) => ({ ...f, carenciaMeses: e.target.value }))}
              placeholder="Ex: 180"
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Descrição *</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Regra Permanente - Homens"
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Legislação *</label>
            <input
              type="text"
              value={form.legislacao}
              onChange={(e) => setForm((f) => ({ ...f, legislacao: e.target.value }))}
              placeholder="Ex: EC 103/2019"
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              placeholder="Notas adicionais sobre esta regra..."
              rows={2}
              className="w-full border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none transition-all"
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
        message="Tem certeza que deseja excluir esta regra de aposentadoria? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
