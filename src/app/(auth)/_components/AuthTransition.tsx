'use client'

import { useEffect, useState } from 'react'

export function AuthTransition({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  )
}
