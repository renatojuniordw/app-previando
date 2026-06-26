import { useEffect, useRef } from 'react'

/**
 * Centralized body scroll lock with reference counting.
 * Prevents conflicts when multiple overlays are open simultaneously.
 */
let activeLocks = 0
let savedOverflow: string | null = null

export function useBodyScrollLock(isLocked: boolean) {
  const isLockedRef = useRef(isLocked)

  useEffect(() => {
    isLockedRef.current = isLocked
  }, [isLocked])

  useEffect(() => {
    return () => {
      if (isLockedRef.current) {
        unlock()
      }
    }
  }, [])

  useEffect(() => {
    if (isLocked) {
      lock()
    } else {
      unlock()
    }
  }, [isLocked])

  function lock() {
    if (activeLocks === 0) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    activeLocks++
  }

  function unlock() {
    activeLocks--
    if (activeLocks <= 0) {
      activeLocks = 0
      if (savedOverflow !== null) {
        document.body.style.overflow = savedOverflow
        savedOverflow = null
      }
    }
  }
}
