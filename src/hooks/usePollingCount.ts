import { useState, useEffect, useRef } from 'react'
import api from '@/lib/api'

/**
 * Hook de polling compartilhado para contagens simples (clientes, casos pendentes).
 * Substitui useClientCount e usePendingCasesCount — elimina duplicação.
 * Usa AbortController para cancelar requests pendentes no unmount.
 */
export function usePollingCount(url: string, intervalMs = 60_000): number {
  const [count, setCount] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()

    const fetch = async () => {
      try {
        const res = await api.get(url, { signal: controller.signal })
        if (mountedRef.current) {
          setCount(res.data.total ?? 0)
        }
      } catch {
        // Request abortada no unmount ou erro de rede — ignora
      }
    }

    fetch()
    const interval = setInterval(fetch, intervalMs)

    return () => {
      mountedRef.current = false
      controller.abort()
      clearInterval(interval)
    }
  }, [url, intervalMs])

  return count
}
