'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Drawer } from '@/components/ui/Drawer'
import { MessageSquare, FileText, Scale, StickyNote, Calculator, AlertCircle, Plus, History, Building2, Download } from 'lucide-react'

interface CaseNotesDrawerProps {
  open: boolean
  onClose: () => void
  caseId: string
}

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

// BPC_ANALYSIS não aparece no formulário de criação — é gerado automaticamente
const NOTE_TYPES_DISPLAY = [
  ...NOTE_TYPES,
  { value: 'BPC', label: 'Análise BPC', icon: Building2 },
]

const NOTE_TYPE_VARIANTS: Record<string, 'blue' | 'green' | 'lime' | 'slate' | 'yellow' | 'red' | 'purple'> = {
  CONTATO: 'blue',
  DOCUMENTO: 'green',
  JURIDICO: 'lime',
  INTERNO: 'slate',
  CALCULO: 'yellow',
  PENDENCIA: 'red',
  BPC: 'purple',
}

export function CaseNotesDrawer({ open, onClose, caseId }: CaseNotesDrawerProps) {
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [type, setType] = useState('CONTATO')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const load = useCallback(() => {
    if (!caseId) return
    setLoading(true)
    api.get(`/cases/${caseId}/notes`)
      .then((r) => setNotes(r.data.notes ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => {
    if (open) {
      load()
      setShowAddForm(false)
      setContent('')
      setType('CONTATO')
      setError('')
    }
  }, [open, load])

  const handleCreate = async () => {
    if (!content.trim()) {
      setError('Conteúdo obrigatório.')
      return
    }
    setCreating(true)
    setError('')
    try {
      await api.post(`/cases/${caseId}/notes`, { type, content })
      setShowAddForm(false)
      setContent('')
      setType('CONTATO')
      addToast({
        type: 'success',
        title: 'Anotação salva',
        message: 'Registro adicionado ao prontuário.',
      })
      load()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Erro ao criar anotação.'
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Prontuário do Caso"
      description="Registro imutável de contatos, documentos e decisões do caso."
    >
      <div className="space-y-6">
        {/* Header Action / Add Toggle */}
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Anotação
          </Button>
        )}

        {/* Inline Add Form */}
        {showAddForm && (
          <Card variant="light" className="p-4 border-amber-200 bg-amber-50/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-sans font-bold text-sm text-slate-800">Nova Anotação</span>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setError('')
                }}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-sans text-[11px] font-medium text-amber-800 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                As anotações são <strong>imutáveis</strong>. Uma vez salvas, não podem ser editadas ou excluídas.
              </p>
            </div>

            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-sans text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-sans font-medium text-xs text-slate-700 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="neo-input"
                >
                  {NOTE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-sans font-medium text-xs text-slate-700 mb-1">Conteúdo</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="neo-input min-h-[100px] resize-none"
                  placeholder="Descreva o contato, documento ou informação relevante..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} loading={creating} className="flex-1 text-xs py-1.5">
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setError('')
                  }}
                  className="flex-1 text-xs py-1.5"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Notes List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-4 bg-slate-100 rounded-full" />
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                </div>
                <div className="h-8 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-sm text-slate-900 mb-1">Sem registros no prontuário</h3>
            <p className="font-sans text-xs text-slate-500 max-w-[240px] mx-auto mb-4">
              Comece adicionando uma nova anotação.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => {
              const noteType = NOTE_TYPES_DISPLAY.find((t) => t.value === note.type)
              const Icon = noteType?.icon ?? FileText
              const variant = NOTE_TYPE_VARIANTS[note.type] ?? 'slate'
              
              // Detectar link do R2
              const r2KeyMatch = note.content.match(/Chave de armazenamento:\s*(documents\/[^\s]+)/)
              const r2Key = r2KeyMatch ? r2KeyMatch[1] : null
              
              // Limpar o texto exibido se contiver a chave do R2
              const cleanContent = r2KeyMatch
                ? note.content.replace(/Chave de armazenamento:\s*documents\/[^\s]+/, '').trim()
                : note.content

              return (
                <Card key={note.id} variant="light" className="p-0 overflow-hidden border-slate-200/80 shadow-xs">
                  <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                        <Icon className="w-3 h-3" />
                      </div>
                      <Badge variant={variant} className="text-[10px] px-1.5 py-0">
                        {noteType?.label ?? note.type}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">v{note.version}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-medium">{formatDate(note.createdAt)}</p>
                      <p className="text-[9px] text-slate-400">{note.author?.name || 'Sistema'}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <p className="font-sans text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {cleanContent}
                    </p>
                    {r2Key && (
                      <a
                        href={`/api/documents/download?key=${encodeURIComponent(r2Key)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-sans font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download do Documento
                      </a>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Drawer>
  )
}
