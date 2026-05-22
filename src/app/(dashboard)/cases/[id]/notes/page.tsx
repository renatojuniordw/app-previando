'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface CaseNote {
  id: string
  type: string
  content: string
  version: number
  createdAt: string
  author?: { name: string | null } | null
}

const NOTE_TYPES = [
  { value: 'CONTATO', label: 'Contato', icon: '🗣' },
  { value: 'DOCUMENTO', label: 'Documento', icon: '📄' },
  { value: 'JURIDICO', label: 'Jurídico', icon: '⚖️' },
  { value: 'INTERNO', label: 'Interno', icon: '📝' },
  { value: 'CALCULO', label: 'Cálculo', icon: '🧮' },
  { value: 'PENDENCIA', label: 'Pendência', icon: '⚠️' },
]

export default function CaseNotesPage() {
  const params = useParams()
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [type, setType] = useState('CONTATO')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    api.get(`/cases/${params.id}/notes`)
      .then((r) => setNotes(r.data.notes ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [params.id])

  const handleCreate = async () => {
    if (!content.trim()) { setError('Conteúdo obrigatório.'); return }
    setCreating(true)
    setError('')
    try {
      await api.post(`/cases/${params.id}/notes`, { type, content })
      setShowModal(false)
      setContent('')
      setType('CONTATO')
      load()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao criar anotação.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-mono font-black text-white uppercase">Prontuário</h2>
        <Button onClick={() => setShowModal(true)}>+ NOVA ANOTAÇÃO</Button>
      </div>

      {loading ? (
        <div className="font-mono text-slate-400 animate-pulse py-8 text-center">Carregando...</div>
      ) : notes.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-700">
          <p className="font-mono text-slate-400 text-sm">Nenhuma anotação registrada.</p>
          <Button size="sm" onClick={() => setShowModal(true)} className="mt-4">
            + PRIMEIRA ANOTAÇÃO
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const noteType = NOTE_TYPES.find((t) => t.value === note.type)
            return (
              <div key={note.id} className="border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{noteType?.icon ?? '📝'}</span>
                    <span className="font-mono font-bold text-xs text-slate-300 uppercase">
                      {noteType?.label ?? note.type}
                    </span>
                    <span className="font-mono text-xs text-slate-600">v{note.version}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-slate-500">{formatDate(note.createdAt)}</span>
                    <p className="font-mono text-xs text-slate-600">
                      {note.author?.name || 'Sistema'}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="NOVA ANOTAÇÃO">
        <div className="mb-3 p-3 border border-amber-600 bg-amber-950">
          <p className="font-mono text-xs text-amber-400">
            ⚠️ As anotações do prontuário são <strong>imutáveis</strong>. Uma vez salvas, não podem ser editadas ou excluídas.
          </p>
        </div>
        {error && (
          <div className="mb-3 p-3 border border-red-500 bg-red-950">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="neo-label">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="neo-input">
              {NOTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="neo-label">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="neo-input min-h-[120px] resize-none"
              placeholder="Descreva o contato, documento ou informação relevante..."
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} loading={creating} className="flex-1">SALVAR</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">CANCELAR</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
