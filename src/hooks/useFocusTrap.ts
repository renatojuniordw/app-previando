'use client'

import { useEffect, useRef } from 'react'

/**
 * Focus trapping hook for modals, drawers, and dialogs.
 *
 * - Moves focus into the container on activation
 * - Traps Tab/Shift+Tab cycling within focusable elements
 * - Restores focus to the previously focused element on deactivation
 *
 * @param active - Whether the focus trap is active
 * @param containerRef - Ref to the container element
 */
export function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // Save the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    if (!container) return

    // Move focus into the container
    const firstFocusable = getFirstFocusable(container)
    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      container.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !container) return

      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the previously focused element
      previousFocusRef.current?.focus()
    }
  }, [active, containerRef])
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  return getFocusableElements(container)[0] ?? null
}
