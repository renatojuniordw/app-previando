'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { CnisData } from '@/types/cnis'
import { isProcessingStatus } from '@/lib/cnis-status'

export function useCnis(clientId: string) {
  const [cnis, setCnis] = useState<CnisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [stuckWarning, setStuckWarning] = useState(false)
  const { addToast } = useToast()

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const stuckRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    if (!clientId) return null

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const r = await api.get(`/cnis/${clientId}`, { signal: controller.signal })
      const cnisDoc = r.data.cnisDocument
      setCnis(cnisDoc)
      return cnisDoc as CnisData | null
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  useEffect(() => {
    if (!cnis || !isProcessingStatus(cnis.processingStatus)) return

    setStuckWarning(false)
    stuckRef.current = setTimeout(() => setStuckWarning(true), 180_000)

    pollRef.current = setInterval(async () => {
      const updated = await load()
      if (updated) {
        if (updated.processingStatus === 'COMPLETED') {
          setShowSuccessBanner(true)
          setStuckWarning(false)
          setTimeout(() => setShowSuccessBanner(false), 5000)
          sendBrowserNotification('Previando - CNIS Concluído', 'O processamento do CNIS foi concluído com sucesso.')
        } else if (updated.processingStatus === 'FAILED') {
          sendBrowserNotification('Previando - Falha no CNIS', `Ocorreu uma falha no processamento do CNIS: ${updated.processingError || 'Erro desconhecido'}`)
        }
      }
      if (updated && !isProcessingStatus(updated.processingStatus)) {
        if (pollRef.current) clearInterval(pollRef.current)
        if (stuckRef.current) clearTimeout(stuckRef.current)
      }
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (stuckRef.current) clearTimeout(stuckRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnis?.processingStatus])

  const handleDelete = async (onSuccess: () => void, onError: (msg: string) => void, setDeleting: (v: boolean) => void) => {
    setDeleting(true)
    try {
      await api.delete(`/cnis/${clientId}`)
      setCnis(null)
      addToast({ type: 'success', title: 'CNIS excluído' })
      onSuccess()
    } catch (err: unknown) {
      onError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao excluir extrato do CNIS.')
    } finally {
      setDeleting(false)
    }
  }

  const handleReprocess = async (onSuccess: (doc: CnisData) => void, onError: (msg: string) => void, setReprocessing: (v: boolean) => void) => {
    setReprocessing(true)
    try {
      const response = await api.post(`/cnis/${clientId}/reprocess`)
      const doc = response.data.cnisDocument as CnisData
      setCnis(doc)
      addToast({ type: 'info', title: 'Processamento reiniciado', message: 'Fila de análise do CNIS relançada!' })
      onSuccess(doc)
    } catch (err: unknown) {
      onError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao reprocessar CNIS.')
    } finally {
      setReprocessing(false)
    }
  }

  return { cnis, setCnis, loading, showSuccessBanner, setShowSuccessBanner, stuckWarning, load, handleDelete, handleReprocess }
}

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body })
  } catch (err) {
    console.error(err)
  }
}
