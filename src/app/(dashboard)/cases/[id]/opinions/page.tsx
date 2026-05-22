'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface Opinion {
  id: string
  status: string
  content: string | null
  editedContent: string | null
  generationCostUsd: number | null
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
    return <div className="font-mono text-slate-400 animate-pulse">Carregando...</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-mono font-black text-white uppercase">Parecer IA</h2>
        <Button onClick={() => setShowConfirm(true)} loading={generating}>
          🤖 GERAR PARECER
        </Button>
      </div>

      {opinions.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-700">
          <div className="text-4xl mb-3">🤖</div>
          <p className="font-mono text-white font-black uppercase mb-2">NENHUM PARECER GERADO</p>
          <p className="font-mono text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            O Previando analisa o caso e gera um parecer preliminar com base nos dados disponíveis.
          </p>
          <Button onClick={() => setShowConfirm(true)} loading={generating}>
            🤖 GERAR PRIMEIRO PARECER
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {opinions.map((opinion) => (
            <div key={opinion.id} className="border-2 border-slate-700">
              <div className="bg-slate-900 px-5 py-3 border-b-2 border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-[10px] uppercase tracking-widest text-[#ccff00]">
                    PARECER
                  </span>
                  <span className={`font-mono font-black text-[10px] uppercase tracking-widest px-2 py-0.5 ${
                    opinion.status === 'FINAL' ? 'bg-[#ccff00] text-slate-950' :
                    opinion.status === 'REVIEWED' ? 'bg-blue-500 text-white' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {STATUS_LABELS[opinion.status] ?? opinion.status}
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase text-slate-500">
                  {formatDate(opinion.createdAt)}
                </span>
              </div>

              {editingId === opinion.id ? (
                <div className="p-5 space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full neo-input min-h-[300px] resize-none font-mono text-sm"
                  />
                  <div className="flex gap-3">
                    <Button onClick={handleSaveEdit} loading={saving} className="flex-1">SALVAR</Button>
                    <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">CANCELAR</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-5">
                    <p className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {opinion.editedContent ?? opinion.content}
                    </p>
                  </div>
                  {opinion.generationCostUsd && (
                    <div className="px-5 pb-2">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">
                        Custo IA: ${opinion.generationCostUsd.toFixed(4)}
                      </p>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-700 p-4 flex gap-3">
                    <button
                      onClick={() => handleEdit(opinion)}
                      className="flex-1 text-center border-2 border-slate-600 text-slate-300 font-mono font-black uppercase tracking-widest text-[10px] py-3 hover:border-slate-400 transition-colors"
                    >
                      ✏️ EDITAR
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(opinion.editedContent ?? opinion.content ?? '')}
                      className="flex-1 text-center bg-[#ccff00] border-2 border-black text-slate-950 font-mono font-black uppercase tracking-widest text-[10px] py-3 hover:bg-[#b3ff00] transition-colors"
                    >
                      📋 COPIAR
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="GERAR PARECER COM IA">
        <div className="space-y-4">
          <div className="border-2 border-amber-600 bg-amber-950 p-3">
            <p className="font-mono text-xs text-amber-400">
              ⚠️ O parecer será gerado com base nos dados do caso. É um parecer preliminar e não substitui análise jurídica completa.
            </p>
          </div>
          <p className="font-mono text-sm text-slate-300">
            Deseja gerar um novo parecer usando inteligência artificial?
          </p>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} loading={generating} className="flex-1">GERAR</Button>
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">CANCELAR</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
