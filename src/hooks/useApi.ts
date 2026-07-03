'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/lib/api'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T = unknown>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetch = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const res = await api.get(url, { signal: controller.signal })
      if (!controller.signal.aborted) {
        setData(res.data)
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao carregar dados.'
      setError(msg)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [url])

  useEffect(() => {
    fetch()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}
