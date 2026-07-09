import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useClientCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const fetch = () => api.get('/clients?limit=1').then(r => setCount(r.data.total ?? 0)).catch(() => {})
    fetch()
    const interval = setInterval(fetch, 60000)
    return () => clearInterval(interval)
  }, [])
  return count
}
