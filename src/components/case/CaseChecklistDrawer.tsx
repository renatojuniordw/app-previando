'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { CheckSquare, Plus, Loader2 } from 'lucide-react'

interface CaseChecklistDrawerProps {
  open: boolean
  onClose: () => void
  caseId: string
}

interface ChecklistItem {
  id: string
  item: string
  completed: boolean
  category: string | null
  createdAt: string
}

export function CaseChecklistDrawer({ open, onClose, caseId }: CaseChecklistDrawerProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [category, setCategory] = useState('')

  const load = useCallback(() => {
    if (!caseId) return
    setLoading(true)
    api.get(`/cases/${caseId}/checklist`)
      .then((r) => setItems(r.data.checklist ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => {
    if (open) {
      load()
      setShowAddForm(false)
      setNewItem('')
      setCategory('')
    }
  }, [open, load])

  const handleCreate = async () => {
    if (!newItem.trim()) return
    setCreating(true)
    try {
      await api.post(`/cases/${caseId}/checklist`, {
        item: newItem,
        category: category || undefined,
      })
      setShowAddForm(false)
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
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completed: !completed } : i))
    )
    try {
      await api.patch(`/cases/${caseId}/checklist/${id}`, { completed: !completed })
    } catch {
      // Revert if error
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, completed } : i))
      )
    }
  }

  const completedCount = items.filter((i) => i.completed).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Checklist do Caso"
      description="Tarefas e pendências a serem resolvidas no processo."
    >
      <div className="space-y-6">
        {/* Progress bar */}
        {items.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-sans font-semibold text-slate-700">
              <span>Progresso</span>
              <span>
                {completedCount}/{items.length} concluídos ({progress}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Add trigger */}
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        )}

        {/* Inline Add form */}
        {showAddForm && (
          <Card variant="light" className="p-4 border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-sans font-bold text-xs text-slate-800">Novo Item</span>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-sans font-medium text-xs text-slate-700 mb-1">Descrição</label>
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="w-full px-3 py-1.5 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="Ex: Solicitar extrato do CNIS"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block font-sans font-medium text-xs text-slate-700 mb-1">Categoria (opcional)</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 font-sans text-sm rounded-md bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="Ex: Documentação, Prazos"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} loading={creating} className="flex-1 text-xs py-1.5">
                  Adicionar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 text-xs py-1.5"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* List of items */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-sm text-slate-900 mb-1">Sem tarefas no checklist</h3>
            <p className="font-sans text-xs text-slate-500 max-w-[240px] mx-auto mb-4">
              Crie uma lista de verificação para acompanhar os passos deste caso.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id, item.completed)}
                className={`border p-3 rounded-lg flex items-start gap-3 cursor-pointer transition-all ${
                  item.completed
                    ? 'border-slate-200 bg-slate-50/70 opacity-60'
                    : 'border-slate-200 hover:border-amber-400 bg-white shadow-xs'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
                    item.completed ? 'bg-amber-500 border-amber-500' : 'border-slate-300 bg-white'
                  }`}
                >
                  {item.completed && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-sans text-xs font-medium leading-tight ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.item}
                  </p>
                  {item.category && (
                    <span className="inline-block bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase mt-1">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}
