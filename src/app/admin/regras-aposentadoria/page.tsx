'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
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
  M:     'Homens',
  F:     'Mulheres',
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
// Agrupa registros por modalidade para exibição
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
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const load = async () => {
    setLoading(true)
    const [regrasResponse, modalidadesResponse] = await Promise.all([
      fetch('/api/admin/regras-aposentadoria'),
      fetch('/api/admin/modalidades'),
    ])
    const regrasData = await regrasResponse.json()
    const modalidadesData = await modalidadesResponse.json()
    setRegistros(regrasData.registros ?? [])
    setModalidades((modalidadesData.modalidades ?? []).filter((item: Modalidade & { ativo: boolean }) => item.ativo))
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const toggleGroup = (modalidade: string) => {
    setExpandedGroups(prev => ({ ...prev, [modalidade]: !prev[modalidade] }))
  }
  const parseNum = (v: string) => v.trim() === '' ? null : parseFloat(v.replace(',', '.'))
  const parseIntVal = (v: string) => v.trim() === '' ? null : window.parseInt(v, 10)
  const handleSubmit = async () => {
    setError('')
    if (!form.modalidade || !form.genero || !form.vigencia || !form.descricao || !form.legislacao) {
      setError('Preencha os campos obrigatórios: modalidade, gênero, vigência, descrição e legislação.')
      return
    }
    setSaving(true)
    try {
      const body = {
        modalidade:            form.modalidade,
        genero:                form.genero,
        vigencia:              form.vigencia,
        idadeMinima:           parseNum(form.idadeMinima),
        tempoContribuicaoAnos: parseIntVal(form.tempoContribuicaoAnos),
        pontosMinimos:         parseIntVal(form.pontosMinimos),
        carenciaMeses:         parseIntVal(form.carenciaMeses),
        descricao:             form.descricao,
        legislacao:            form.legislacao,
        observacoes:           form.observacoes || null,
      }
      if (editingId) {
        await fetch(`/api/admin/regras-aposentadoria/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/regras-aposentadoria', {
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
  const handleEdit = (r: RegraAposentadoria) => {
    setEditingId(r.id)
    setForm({
      modalidade:            r.modalidade,
      genero:                r.genero,
      vigencia:              r.vigencia.slice(0, 10),
      idadeMinima:           r.idadeMinima !== null ? String(Number(r.idadeMinima).toFixed(1)) : '',
      tempoContribuicaoAnos: r.tempoContribuicaoAnos !== null ? String(r.tempoContribuicaoAnos) : '',
      pontosMinimos:         r.pontosMinimos !== null ? String(r.pontosMinimos) : '',
      carenciaMeses:         r.carenciaMeses !== null ? String(r.carenciaMeses) : '',
      descricao:             r.descricao,
      legislacao:            r.legislacao,
      observacoes:           r.observacoes ?? '',
    })
    setShowForm(true)
    setError('')
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Confirma a exclusão deste registro?')) return
    await fetch(`/api/admin/regras-aposentadoria/${id}`, {
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
  const grouped = groupByModalidade(registros)
  const modalidadeLabels = Object.fromEntries(modalidades.map(({ codigo, label }) => [codigo, label]))
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">Regras de Aposentadoria</h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Parâmetros das modalidades de cálculo. O engine sempre usa a regra com vigência mais recente anterior à DIB.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError('') }}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-sans font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Regra
          </button>
        )}
      </div>
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-lg text-slate-900">
            {editingId ? 'Editar Regra' : 'Nova Regra'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Modalidade *</label>
              <select
                value={form.modalidade}
                onChange={e => setForm(f => ({ ...f, modalidade: e.target.value }))}
                disabled={!!editingId}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Selecione...</option>
                {modalidades.map((modalidade) => (
                  <option key={modalidade.codigo} value={modalidade.codigo}>{modalidade.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Gênero *</label>
              <select
                value={form.genero}
                onChange={e => setForm(f => ({ ...f, genero: e.target.value }))}
                disabled={!!editingId}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="M">Homens (M)</option>
                <option value="F">Mulheres (F)</option>
                <option value="AMBOS">Ambos</option>
              </select>
            </div>
            <div>
              <DatePicker
                label="Vigência (início) *"
                value={form.vigencia}
                onChange={(d) => setForm(f => ({ ...f, vigencia: d ? d.toISOString().split('T')[0] : '' }))}
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Idade Mínima (anos)</label>
              <input
                type="number"
                step="0.5"
                value={form.idadeMinima}
                onChange={e => setForm(f => ({ ...f, idadeMinima: e.target.value }))}
                placeholder="Ex: 62 ou 59.5"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Tempo de Contribuição (anos)</label>
              <input
                type="number"
                step="1"
                value={form.tempoContribuicaoAnos}
                onChange={e => setForm(f => ({ ...f, tempoContribuicaoAnos: e.target.value }))}
                placeholder="Ex: 35"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Pontos Mínimos</label>
              <input
                type="number"
                step="1"
                value={form.pontosMinimos}
                onChange={e => setForm(f => ({ ...f, pontosMinimos: e.target.value }))}
                placeholder="Ex: 103"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Carência (meses)</label>
              <input
                type="number"
                step="1"
                value={form.carenciaMeses}
                onChange={e => setForm(f => ({ ...f, carenciaMeses: e.target.value }))}
                placeholder="Ex: 180"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Descrição *</label>
              <input
                type="text"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Regra Permanente - Homens"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Legislação *</label>
              <input
                type="text"
                value={form.legislacao}
                onChange={e => setForm(f => ({ ...f, legislacao: e.target.value }))}
                placeholder="Ex: EC 103/2019"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-sans text-xs font-bold text-slate-600 mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Notas adicionais sobre esta regra..."
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none resize-none"
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
      {loading ? (
        <div className="py-12 text-center font-sans text-sm text-slate-400">Carregando...</div>
      ) : registros.length === 0 ? (
        <div className="py-12 text-center font-sans text-sm text-slate-400">Nenhuma regra cadastrada. Clique em &quot;Nova Regra&quot; para começar.</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([modalidade, regs]) => {
            const isExpanded = expandedGroups[modalidade] !== false // padrão: aberto
            const label = modalidadeLabels[modalidade] ?? modalidade
            return (
              <div key={modalidade} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleGroup(modalidade)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-sm text-slate-900">{label}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-sans font-medium">
                      {modalidade}
                    </span>
                    <span className="text-xs text-slate-400 font-sans">{regs.length} registro{regs.length !== 1 ? 's' : ''}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="grid grid-cols-[80px_1fr_80px_100px_80px_80px_1fr_80px_auto] px-5 py-2.5 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span>Gênero</span>
                      <span>Descrição</span>
                      <span>Idade Mín.</span>
                      <span>Tempo Contrib.</span>
                      <span>Pontos</span>
                      <span>Carência</span>
                      <span>Legislação</span>
                      <span>Vigência</span>
                      <span></span>
                    </div>
                    {regs.map((r, i) => (
                      <div
                        key={r.id}
                        className={`grid grid-cols-[80px_1fr_80px_100px_80px_80px_1fr_80px_auto] px-5 py-3.5 items-center text-sm font-sans border-t border-slate-100 ${i === 0 ? 'bg-amber-50' : ''}`}
                      >
                        <span className={`font-semibold text-xs px-2 py-0.5 rounded w-fit ${r.genero === 'M' ? 'bg-blue-100 text-blue-700' : r.genero === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600'}`}>
                          {GENERO_LABELS[r.genero] ?? r.genero}
                        </span>
                        <span className="text-slate-700 text-xs pr-2">{r.descricao}</span>
                        <span className="text-slate-600">{r.idadeMinima !== null ? `${Number(r.idadeMinima)} anos` : '—'}</span>
                        <span className="text-slate-600">{r.tempoContribuicaoAnos !== null ? `${r.tempoContribuicaoAnos} anos` : '—'}</span>
                        <span className="text-slate-600">{r.pontosMinimos !== null ? r.pontosMinimos : '—'}</span>
                        <span className="text-slate-600">{r.carenciaMeses !== null ? `${r.carenciaMeses} m` : '—'}</span>
                        <span className="text-slate-500 text-xs">{r.legislacao}</span>
                        <span className="text-slate-500 text-xs">
                          {fmtDate(r.vigencia)}
                          {i === 0 && <span className="ml-1 text-[9px] bg-amber-500 text-white px-1 py-0.5 rounded font-bold uppercase">Vigente</span>}
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
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <p className="font-sans text-xs text-slate-400">
        Total: {registros.length} registros · Para atualizar uma regra, adicione um novo registro com a mesma modalidade/gênero e uma vigência futura.
      </p>
    </div>
  )
}
