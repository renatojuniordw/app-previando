'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'

export interface ClientCaseSummary {
  id: string
  status: string
  benefitType: string
  priority: string
  createdAt: string
  cnisDocument?: { processingStatus: string } | null
}

export interface ClientDetail {
  id: string
  name: string
  cpf: string
  birthDate: string
  phone: string | null
  email: string | null
  maritalStatus: string | null
  profession: string | null
  street: string | null
  streetNumber: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  priority: string
  notes: string | null
  cases: ClientCaseSummary[]
}

export interface NewCaseInput {
  benefitType: string
  priority: 'CRITICAL' | 'ATTENTION' | 'NORMAL'
  notes?: string
}

/**
 * Concentra o carregamento e as mutações da tela de detalhe do cliente,
 * mantendo os componentes de UI livres de chamadas diretas à API.
 */
export function useClientDetail(clientId: string) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const loadClient = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const r = await api.get(`/clients/${clientId}`)
      setClient(r.data.client)
    } catch {
      setClient(null)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    loadClient()
  }, [loadClient])

  const createCase = async (data: NewCaseInput) => {
    await api.post('/cases', { clientId, ...data })
    addToast({ type: 'success', title: 'Caso criado', message: 'Novo caso vinculado ao cliente.' })
    await loadClient()
  }

  const saveNotes = async (notes: string) => {
    await api.put(`/clients/${clientId}`, { notes })
    addToast({ type: 'success', title: 'Sucesso', message: 'Observações atualizadas.' })
    await loadClient()
  }

  return { client, loading, loadClient, createCase, saveNotes }
}
