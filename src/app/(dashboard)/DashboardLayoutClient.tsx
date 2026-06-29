'use client'

import { useState, useEffect } from 'react'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { ShortcutsModal } from '@/components/ShortcutsModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import api from '@/lib/api'

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [showWizard, setShowWizard] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    // Se o wizard já foi dispensado neste dispositivo, não consultar a API
    const localDismissed = localStorage.getItem('onboarding-wizard-seen')
    if (localDismissed) return

    api
      .get<{ isFirstLogin: boolean }>('/onboarding/progress')
      .then(({ data }) => {
        if (data.isFirstLogin) setShowWizard(true)
      })
      .catch(() => {
        // fallback: mantém sem wizard
      })
  }, [])

  useKeyboardShortcuts([
    {
      keys: ['?'],
      description: 'Abrir ajuda com atalhos',
      action: () => setShowShortcuts(true),
    },
    {
      keys: ['Escape'],
      description: 'Fechar modais',
      action: () => {
        setShowShortcuts(false)
        setShowWizard(false)
      },
    },
  ])

  const handleWizardComplete = () => {
    localStorage.setItem('onboarding-wizard-seen', 'true')
    setShowWizard(false)
  }

  return (
    <>
      {!showWizard && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto w-full">
          <OnboardingChecklist />
        </div>
      )}

      {children}

      <OnboardingWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
