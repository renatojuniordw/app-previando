'use client'

import { useEffect, useRef } from 'react'

/**
 * Centralized body scroll lock with reference counting.
 * Prevents conflicts when multiple overlays are open simultaneously.
 * Compensates for scrollbar disappearance to avoid layout shift.
 */
let activeLocks = 0
let savedOverflow: string | null = null
let savedPaddingRight: string | null = null

function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth
}

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
      savedPaddingRight = document.body.style.paddingRight
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
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
      if (savedPaddingRight !== null) {
        document.body.style.paddingRight = savedPaddingRight
        savedPaddingRight = null
      }
    }
  }
}
