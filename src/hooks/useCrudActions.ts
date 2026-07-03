'use client'

import { useState, useCallback } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { extractApiError } from '@/lib/api-error'

interface UseCrudActionsOptions {
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
}

export function useCrudActions(url: string, options: UseCrudActionsOptions = {}) {
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  const { successMessage, errorMessage, onSuccess } = options

  const create = useCallback(
    async (data: unknown) => {
      setLoading(true)
      try {
        await api.post(url, data)
        addToast({ type: 'success', title: successMessage || 'Criado com sucesso.' })
        onSuccess?.()
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: errorMessage || 'Erro ao criar.',
          message: extractApiError(err),
        })
      } finally {
        setLoading(false)
      }
    },
    [url, successMessage, errorMessage, onSuccess, addToast]
  )

  const update = useCallback(
    async (id: string, data: unknown) => {
      setLoading(true)
      try {
        await api.patch(`${url}/${id}`, data)
        addToast({ type: 'success', title: successMessage || 'Atualizado com sucesso.' })
        onSuccess?.()
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: errorMessage || 'Erro ao atualizar.',
          message: extractApiError(err),
        })
      } finally {
        setLoading(false)
      }
    },
    [url, successMessage, errorMessage, onSuccess, addToast]
  )

  const remove = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        await api.delete(`${url}/${id}`)
        addToast({ type: 'success', title: 'Removido com sucesso.' })
        onSuccess?.()
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: errorMessage || 'Erro ao remover.',
          message: extractApiError(err),
        })
      } finally {
        setLoading(false)
      }
    },
    [url, errorMessage, onSuccess, addToast]
  )

  return { create, update, remove, loading }
}
