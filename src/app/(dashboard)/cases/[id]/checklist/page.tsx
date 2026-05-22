'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ChecklistItem {
  id: string
  item: string
  completed: boolean
  category: string | null
  createdAt: string
}

export default function ChecklistPage() {
  const params = useParams()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [category, setCategory] = useState('')

  const load = () => {
    api.get(`/cases/${params.id}/checklist`)
      .then((r) => setItems(r.data.checklist ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [params.id])

  const handleCreate = async () => {
    if (!newItem.trim()) return
    setCreating(true)
    try {
      await api.post(`/cases/${params.id}/checklist`, { item: newItem, category: category || undefined })
      setShowModal(false)
      setNewItem('')
      setCategory('')
      load()
    } catch {
      // noop
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id: string, completed: boolean) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: !completed } : i))
    try {
      await api.patch(`/cases/${params.id}/checklist/${id}`, { completed: !completed })
    } catch {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed } : i))
    }
  }

  const completedCount = items.filter((i) => i.completed).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  if (loading) {
    return <div className="font-mono text-slate-400 animate-pulse">Carregando...</div>
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono font-black text-white uppercase">Checklist</h2>
          {items.length > 0 && (
            <p className="font-mono text-xs text-slate-400">{completedCount}/{items.length} concluídos</p>
          )}
        </div>
        <Button onClick={() => setShowModal(true)}>+ NOVO ITEM</Button>
      </div>

      {items.length > 0 && (
        <div className="border-2 border-slate-700">
          <div className="h-2 bg-slate-800">
            <div
              className="h-full bg-[#ccff00] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-700">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-mono text-slate-400 text-sm">Nenhum item no checklist.</p>
          <Button size="sm" onClick={() => setShowModal(true)} className="mt-4">
            + ADICIONAR ITEM
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`border-2 p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                item.completed ? 'border-slate-700 bg-slate-900 opacity-60' : 'border-slate-600 hover:border-[#ccff00]'
              }`}
              onClick={() => handleToggle(item.id, item.completed)}
            >
              <div className={`mt-0.5 w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                item.completed ? 'bg-[#ccff00] border-[#ccff00]' : 'border-slate-500'
              }`}>
                {item.completed && <span className="text-slate-950 text-xs font-black">✓</span>}
              </div>
              <div className="flex-1">
                <p className={`font-mono text-sm ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                  {item.item}
                </p>
                {item.category && (
                  <p className="font-mono text-xs text-slate-500 mt-0.5 uppercase">{item.category}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="NOVO ITEM DO CHECKLIST">
        <div className="space-y-4">
          <div>
            <label className="neo-label">Item</label>
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="neo-input"
              placeholder="Ex: Solicitar extrato do INSS"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <label className="neo-label">Categoria (opcional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="neo-input"
              placeholder="Ex: Documentos, Prazos"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} loading={creating} className="flex-1">ADICIONAR</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">CANCELAR</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
