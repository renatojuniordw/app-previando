import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useClientCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    api.get('/clients?limit=1').then(r => setCount(r.data.total ?? 0)).catch(() => {})
  }, [])
  return count
}
