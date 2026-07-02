'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/store/toast'
import { AlertCircle } from 'lucide-react'

interface DeleteClientModalProps {
  open: boolean
  onClose: () => void
  client: { id: string; name: string } | null
  onDeleted: () => void
}

export function DeleteClientModal({ open, onClose, client, onDeleted }: DeleteClientModalProps) {
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  const handleConfirm = async () => {
    if (!client) return
    setDeleting(true)
    try {
      await api.delete(`/clients/${client.id}`)
      addToast({ type: 'success', title: 'Cliente excluído', message: `${client.name} foi removido.` })
      onClose()
      onDeleted()
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o cliente.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Excluir Cliente?">
      <div className="space-y-4">
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm font-bold text-red-800">Atenção: Esta ação é irreversível!</p>
            <p className="font-sans text-sm text-red-700 mt-1">
              Todos os dados de <strong>{client?.name}</strong>, incluindo casos, cálculos e documentos, serão excluídos permanentemente.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleConfirm} loading={deleting} variant="danger" className="flex-1">
            Sim, Excluir Tudo
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
