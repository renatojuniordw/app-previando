'use client'

import { useEffect, useCallback } from 'react'

interface Shortcut {
  keys: string[]       // e.g., ['g', 'd'] for "g then d"
  description: string
  action: () => void
  enabled?: boolean
  metaKey?: boolean    // Require Meta (⌘) key
  ctrlKey?: boolean    // Require Ctrl key
}

/**
 * Custom hook for keyboard shortcuts.
 *
 * Supports multi-key shortcuts (like "g then d" for Dashboard)
 * and single keys (like "?" for help).
 *
 * @example
 * useKeyboardShortcuts([
 *   { keys: ['g', 'd'], description: 'Ir para Dashboard', action: () => router.push('/dashboard') },
 *   { keys: ['?'], description: 'Abrir ajuda', action: () => setHelpOpen(true) },
 * ])
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Still allow Escape to work in inputs
        if (e.key !== 'Escape') return
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        // Single key shortcuts (like ?, Escape)
        if (shortcut.keys.length === 1) {
          if (shortcut.metaKey) {
            if (e.metaKey && e.key.toLowerCase() === shortcut.keys[0].toLowerCase()) {
              e.preventDefault()
              shortcut.action()
              return
            }
            continue
          }

          if (shortcut.ctrlKey) {
            if (e.ctrlKey && e.key.toLowerCase() === shortcut.keys[0].toLowerCase()) {
              e.preventDefault()
              shortcut.action()
              return
            }
            continue
          }

          if (
            shortcut.keys[0] !== '?' &&
            shortcut.keys[0] !== 'Escape' &&
            (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
          ) {
            continue
          }

          if (
            e.key.toLowerCase() === shortcut.keys[0].toLowerCase() &&
            !e.metaKey &&
            !e.ctrlKey &&
            !e.altKey
          ) {
            e.preventDefault()
            shortcut.action()
            return
          }
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Shortcut help modal content - all available shortcuts
 */
export const SHORTCUTS_LIST = [
  { keys: '?', description: 'Abrir ajuda de atalhos' },
  { keys: 'Esc', description: 'Fechar modal/drawer' },
  { keys: 'g + d', description: 'Ir para Dashboard' },
  { keys: 'g + c', description: 'Ir para Clientes' },
  { keys: 'g + k', description: 'Ir para Kanban' },
  { keys: 'g + n', description: 'Ir para Novo Cliente' },
  { keys: '⌘/Ctrl + K', description: 'Busca global' },
  { keys: 'b', description: 'Ir para Configurações de Plano' },
  { keys: '1-5', description: 'Navegar entre tabs do caso' },
]
