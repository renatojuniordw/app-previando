'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { MessageSquare, FileText, Scale, StickyNote, Calculator, AlertCircle, Plus, History } from 'lucide-react'

interface CaseNote {
  id: string
  type: string
  content: string
  version: number
  createdAt: string
  author?: { name: string | null } | null
}

const NOTE_TYPES = [
  { value: 'CONTATO', label: 'Contato', icon: MessageSquare },
  { value: 'DOCUMENTO', label: 'Documento', icon: FileText },
  { value: 'JURIDICO', label: 'Jurídico', icon: Scale },
  { value: 'INTERNO', label: 'Interno', icon: StickyNote },
  { value: 'CALCULO', label: 'Cálculo', icon: Calculator },
  { value: 'PENDENCIA', label: 'Pendência', icon: AlertCircle },
]

const NOTE_TYPE_VARIANTS: Record<string, 'blue' | 'green' | 'lime' | 'slate' | 'yellow' | 'red'> = {
  CONTATO: 'blue',
  DOCUMENTO: 'green',
  JURIDICO: 'lime',
  INTERNO: 'slate',
  CALCULO: 'yellow',
  PENDENCIA: 'red',
}

export default function CaseNotesPage() {
  const params = useParams()
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [type, setType] = useState('CONTATO')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const load = useCallback(() => {
    api.get(`/cases/${params.id}/notes`)
      .then((r) => setNotes(r.data.notes ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!content.trim()) { setError('Conteúdo obrigatório.'); return }
    setCreating(true)
    setError('')
    try {
      await api.post(`/cases/${params.id}/notes`, { type, content })
      setShowModal(false)
      setContent('')
      setType('CONTATO')
      addToast({ type: 'success', title: 'Anotação salva', message: 'Registro adicionado ao prontuário.' })
      load()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao criar anotação.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">Prontuário</h2>
          <p className="font-sans text-sm text-slate-500 mt-1">Registro imutável de contatos, documentos e decisões do caso.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Nova Anotação
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-5 bg-slate-100 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
              <div className="h-12 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card variant="light" className="p-12 text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Nenhuma anotação registrada</h3>
          <p className="font-sans text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Registre contatos, documentos e decisões importantes do caso. As anotações são imutáveis após salvas.
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Primeira Anotação
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const noteType = NOTE_TYPES.find((t) => t.value === note.type)
            const Icon = noteType?.icon ?? FileText
            const variant = NOTE_TYPE_VARIANTS[note.type] ?? 'slate'
            return (
              <Card key={note.id} variant="light" className="p-0 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <Badge variant={variant}>{noteType?.label ?? note.type}</Badge>
                    <span className="text-xs text-slate-400 font-mono">v{note.version}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">{formatDate(note.createdAt)}</p>
                    <p className="text-xs text-slate-400">{note.author?.name || 'Sistema'}</p>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="font-sans text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Anotação">
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-sans text-xs font-medium text-amber-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            As anotações do prontuário são <strong>imutáveis</strong>. Uma vez salvas, não podem ser editadas ou excluídas.
          </p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-sans text-sm text-red-600">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            >
              {NOTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-sans font-medium text-sm text-slate-700 mb-1">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent min-h-[120px] resize-none"
              placeholder="Descreva o contato, documento ou informação relevante..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} loading={creating} className="flex-1">Salvar</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
