'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ArrowRight, Users, FileText, Calculator, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface OnboardingStep {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  action: string
  href: string
}

const STEPS: OnboardingStep[] = [
  {
    id: 'client',
    icon: <Users className="w-8 h-8 text-amber-600" aria-hidden="true" />,
    title: 'Cadastre um cliente',
    description: 'Registre o primeiro segurado para começar a usar o Previando. Adicione nome, CPF e data de nascimento.',
    action: 'Cadastrar Cliente',
    href: '/clients/list',
  },
  {
    id: 'case',
    icon: <FileText className="w-8 h-8 text-amber-600" aria-hidden="true" />,
    title: 'Crie um caso',
    description: 'Cada cliente pode ter um ou mais casos. Crie um caso selecionando o tipo de benefício previdenciário.',
    action: 'Criar Caso',
    href: '/clients/list',
  },
  {
    id: 'cnis',
    icon: <Calculator className="w-8 h-8 text-amber-600" aria-hidden="true" />,
    title: 'Faça upload do CNIS',
    description: 'Baixe o CNIS do seu cliente no Meu INSS e faça o upload para processamento automático.',
    action: 'Upload CNIS',
    href: '/cases',
  },
]

interface OnboardingWizardProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  if (!open) return null

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleAction = () => {
    if (isLastStep) {
      onComplete()
    }
    router.push(step.href)
    onClose()
  }

  const handleSkip = () => {
    onComplete()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleSkip}
      role="dialog"
      aria-modal="true"
      aria-label="Tour de boas-vindas"
      aria-describedby="onboarding-desc"
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-elevation-lg max-w-lg w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 text-xs font-sans font-medium ${
                i <= currentStep ? 'text-amber-700' : 'text-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < currentStep
                    ? 'bg-amber-500 text-white'
                    : i === currentStep
                    ? 'bg-amber-100 text-amber-700 border border-amber-400'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                {i < currentStep ? '✓' : i + 1}
              </span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="mb-6" key={step.id}>
          <div className="mb-4 p-3 bg-amber-50 rounded-xl w-fit">{step.icon}</div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 mb-2">{step.title}</h2>
          <p id="onboarding-desc" className="font-sans text-sm text-slate-600 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="font-sans text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Pular tour
          </button>

          <div className="flex items-center gap-3">
            {!isLastStep && (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))}
                className="font-sans text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Próximo
              </button>
            )}

            <Button variant="primary" onClick={handleAction} size="md">
              {isLastStep ? 'Começar a usar!' : step.action}
              {isLastStep ? (
                <CheckCircle2 className="w-4 h-4 ml-1" aria-hidden="true" />
              ) : (
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
