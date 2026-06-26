'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { formatDate } from '@/lib/utils'
import { OPINION_STATUS_LABELS as STATUS_LABELS } from '@/lib/constants'
import { Bot, Loader2, Sparkles, Clipboard, Edit2, AlertTriangle } from 'lucide-react'

interface CaseOpinionsDrawerProps {
  open: boolean
  onClose: () => void
  caseId: string
}

interface Opinion {
  id: string
  status: string
  content: string | null
  editedContent: string | null
  generationCostUsd: number | string | null
  createdAt: string
  updatedAt: string
}

export function CaseOpinionsDrawer({ open, onClose, caseId }: CaseOpinionsDrawerProps) {
  const [opinions, setOpinions] = useState<Opinion[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { addToast } = useToast()

  const load = useCallback(() => {
    if (!caseId) return
    setLoading(true)
    api.get(`/cases/${caseId}/opinions`)
      .then((r) => setOpinions(r.data.opinions ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => {
    if (open) {
      load()
      setEditingId(null)
      setShowConfirmModal(false)
    }
  }, [open, load])

  const handleGenerate = async () => {
    setGenerating(true)
    setShowConfirmModal(false)
    try {
      await api.post(`/cases/${caseId}/opinions`)
      addToast({
        type: 'success',
        title: 'Parecer gerado',
        message: 'O parecer com IA está pronto para revisão.',
      })
      load()
    } catch {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível gerar o parecer.',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleEdit = (opinion: Opinion) => {
    setEditingId(opinion.id)
    setEditContent(opinion.editedContent ?? opinion.content ?? '')
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      await api.put(`/cases/${caseId}/opinions/${editingId}`, {
        editedContent: editContent,
        status: 'REVIEWED',
      })
      setEditingId(null)
      addToast({
        type: 'success',
        title: 'Parecer salvo',
        message: 'Alterações registradas.',
      })
      load()
    } catch {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível salvar o parecer.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({
      type: 'success',
      title: 'Copiado!',
      message: 'Parecer copiado para a área de transferência.',
    })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Parecer com IA"
      description="Análise jurídica e técnica preliminar baseada nos dados importados."
    >
      <div className="space-y-6 font-sans">
        {/* Generate trigger */}
        <Button
          onClick={() => setShowConfirmModal(true)}
          loading={generating}
          className="w-full flex align-items-center justify-content-center gap-2"
        >
          <Bot className="w-4 h-4" />
          Gerar Novo Parecer com IA
        </Button>

        {loading ? (
          <div className="flex justify-content-center align-items-center py-12">
            <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
          </div>
        ) : opinions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[var(--color-border)] bg-transparent rounded-xl">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-sm text-slate-900 mb-1">Nenhum parecer gerado</h3>
            <p className="font-sans text-xs text-slate-500 max-w-[240px] mx-auto">
              O Previando analisa o caso e gera pareceres com recomendações automáticas.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {opinions.map((opinion) => (
              <Card key={opinion.id} variant="light" className="p-0 overflow-hidden border-[var(--color-border)] shadow-xs bg-white">
                <div style={{background:"var(--color-surface)"}} className=" px-4 py-2.5 border-b border-[var(--color-border)] flex align-items-center justify-content-between">
                  <div className="flex align-items-center gap-2">
                    <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-slate-400">
                      Análise IA
                    </span>
                    <Badge
                      variant={
                        opinion.status === 'FINAL'
                          ? 'green'
                          : opinion.status === 'REVIEWED'
                          ? 'blue'
                          : 'slate'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {STATUS_LABELS[opinion.status] ?? opinion.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {formatDate(opinion.createdAt)}
                  </span>
                </div>

                {editingId === opinion.id ? (
                  <div className="p-4 space-y-3 bg-transparent">
                    <div>
                      <label className="block font-sans font-semibold text-xs text-slate-700 mb-1">
                        Editar Conteúdo do Parecer
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 font-sans text-xs rounded-md bg-white text-slate-900 border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[220px] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} loading={saving} className="flex-1 text-xs py-1.5">
                        Salvar Alterações
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="flex-1 text-xs py-1.5"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4">
                      <p className="font-sans text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {opinion.editedContent ?? opinion.content}
                      </p>
                    </div>

                    <div className="border-t border-[var(--color-border)] bg-transparent px-4 py-2.5 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(opinion)}
                        className="flex-1 text-[11px] py-1.5 flex align-items-center justify-content-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCopy(opinion.editedContent ?? opinion.content ?? '')}
                        className="flex-1 text-[11px] py-1.5 flex align-items-center justify-content-center gap-1.5"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        Copiar
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Gerar Parecer com IA">
        <div className="space-y-4 font-sans text-slate-700">
          <div className="border border-[#F0B09A] bg-[rgba(242,232,228,0.5)] p-3 rounded-md flex align-items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <p className="text-xs text-[#A03A15] leading-relaxed">
              O parecer será gerado usando inteligência artificial com base no CNIS e nos cálculos. É uma análise preliminar e não substitui o julgamento profissional.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Deseja gerar um novo parecer com IA?
          </p>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} loading={generating} className="flex-1">
              Confirmar
            </Button>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </Drawer>
  )
}
