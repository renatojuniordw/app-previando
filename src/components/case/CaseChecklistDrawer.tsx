'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useApi } from '@/hooks/useApi'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { CheckSquare, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/store/toast'

interface CaseChecklistDrawerProps {
  open: boolean
  onClose: () => void
  caseId: string
}

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  required: boolean
}

export function CaseChecklistDrawer({ open, onClose, caseId }: CaseChecklistDrawerProps) {
  const { addToast } = useToast()
  const { data, loading, refetch } = useApi<{ checklist?: { items: ChecklistItem[] } }>(`/cases/${caseId}/checklist`)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [hasChecklist, setHasChecklist] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    if (data) {
      setHasChecklist(!!data.checklist)
      setItems(Array.isArray(data.checklist?.items) ? data.checklist.items : [])
    }
  }, [data])

  useEffect(() => {
    if (open) {
      refetch()
      setShowAddForm(false)
      setNewItem('')
    }
  }, [open, refetch])

  const saveItems = async (updated: ChecklistItem[]) => {
    if (hasChecklist) {
      await api.patch(`/cases/${caseId}/checklist`, { items: updated })
    } else {
      await api.post(`/cases/${caseId}/checklist`, {
        items: updated,
        eligible: true,
        pendencias: [],
      })
      setHasChecklist(true)
    }
  }

  const handleToggle = async (id: string) => {
    const updated = items.map((i) => i.id === id ? { ...i, checked: !i.checked } : i)
    setItems(updated)
    try {
      await saveItems(updated)
    } catch {
      setItems(items)
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao atualizar item.' })
    }
  }

  const handleCreate = async () => {
    if (!newItem.trim()) return
    setCreating(true)
    try {
      const newEntry: ChecklistItem = {
        id: `item-${Date.now()}`,
        label: newItem.trim(),
        checked: false,
        required: false,
      }
      const updated = [...items, newEntry]
      await saveItems(updated)
      setItems(updated)
      setShowAddForm(false)
      setNewItem('')
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao criar item.' })
    } finally {
      setCreating(false)
    }
  }

  const completedCount = items.filter((i) => i.checked).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Checklist do Caso"
      description="Tarefas e pendências a serem resolvidas no processo."
    >
      <div className="space-y-6">
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

        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="w-full flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        )}

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
                onClick={() => handleToggle(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleToggle(item.id)
                  }
                }}
                role="checkbox"
                aria-checked={item.checked}
                tabIndex={0}
                className={`border p-3 rounded-lg flex items-start gap-3 cursor-pointer transition-all ${
                  item.checked
                    ? 'border-slate-200 bg-slate-50/70 opacity-60'
                    : 'border-slate-200 hover:border-amber-400 bg-white shadow-xs'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
                    item.checked ? 'bg-amber-500 border-amber-500' : 'border-slate-300 bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {item.checked && <span className="text-white text-[10px] font-bold" aria-hidden="true">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-sans text-xs font-medium leading-tight ${
                      item.checked ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.required && (
                    <span className="inline-block bg-amber-50 text-amber-600 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase mt-1">
                      Obrigatório
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
