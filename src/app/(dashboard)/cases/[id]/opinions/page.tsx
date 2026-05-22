'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface Opinion {
  id: string
  status: string
  content: string | null
  editedContent: string | null
  generationCostUsd: number | string | null
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  REVIEWED: 'Revisado',
  FINAL: 'Final',
}

export default function OpinionsPage() {
  const params = useParams()
  const [opinions, setOpinions] = useState<Opinion[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const load = () => {
    api.get(`/cases/${params.id}/opinions`)
      .then((r) => setOpinions(r.data.opinions ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [params.id])

  const handleGenerate = async () => {
    setGenerating(true)
    setShowConfirm(false)
    try {
      await api.post(`/cases/${params.id}/opinions`)
      load()
    } catch {
      // noop
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
      await api.put(`/cases/${params.id}/opinions/${editingId}`, {
        editedContent: editContent,
        status: 'REVIEWED',
      })
      setEditingId(null)
      load()
    } catch {
      // noop
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="neo-spinner text-amber-600 mr-2" />
        <span className="font-sans text-sm text-slate-500">Carregando pareceres...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="font-serif font-semibold text-xl text-slate-900">Pareceres com IA</h2>
        <Button onClick={() => setShowConfirm(true)} loading={generating} size="sm">
          🤖 Gerar Parecer
        </Button>
      </div>

      {opinions.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 bg-white rounded-lg shadow-sm">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="font-sans font-semibold text-slate-900 mb-2">Nenhum parecer gerado</h3>
          <p className="font-sans text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
            O Previando analisa o caso e gera um parecer preliminar com base nos dados disponíveis.
          </p>
          <Button onClick={() => setShowConfirm(true)} loading={generating}>
            🤖 Gerar Primeiro Parecer
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {opinions.map((opinion) => (
            <Card variant="light" key={opinion.id} className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    PARECER
                  </span>
                  <Badge
                    variant={
                      opinion.status === 'FINAL' ? 'green' :
                      opinion.status === 'REVIEWED' ? 'blue' :
                      'slate'
                    }
                  >
                    {STATUS_LABELS[opinion.status] ?? opinion.status}
                  </Badge>
                </div>
                <span className="font-sans text-xs text-slate-500">
                  {formatDate(opinion.createdAt)}
                </span>
              </div>

              {editingId === opinion.id ? (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="neo-label">Editar Conteúdo do Parecer</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full neo-input min-h-[300px] resize-none font-sans text-sm focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveEdit} loading={saving} className="flex-1">
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <p className="font-sans text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {opinion.editedContent ?? opinion.content}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(opinion)}
                      className="flex-1 text-xs py-2"
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => navigator.clipboard.writeText(opinion.editedContent ?? opinion.content ?? '')}
                      className="flex-1 text-xs py-2"
                    >
                      📋 Copiar Parecer
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Gerar Parecer com IA">
        <div className="space-y-4 font-sans">
          <div className="border border-amber-200 bg-amber-50/50 p-3 rounded-md">
            <p className="text-xs text-amber-800 leading-relaxed">
              ⚠️ O parecer será gerado com base nos dados do caso. É um parecer preliminar e não substitui uma análise jurídica completa.
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Deseja gerar um novo parecer usando inteligência artificial?
          </p>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} loading={generating} className="flex-1">
              Gerar
            </Button>
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
