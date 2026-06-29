'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Users, FileText, Calculator, CheckCircle2, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface OnboardingStep {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  action: string
  href: string
  dica?: string
}

interface OnboardingWizardProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [boasVindas, setBoasVindas] = useState<string | null>(null)
  const [loadingDica, setLoadingDica] = useState(false)
  const router = useRouter()

  // Gera dica personalizada com IA na abertura
  useEffect(() => {
    if (!open) return
    setLoadingDica(true)

    const controller = new AbortController()

    api.get('/onboarding/progress')
      .then((r) => {
        if (controller.signal.aborted) return
        const data = r.data

        // Gera dica personalizada baseada no progresso
        if (!data.hasClients) {
          setBoasVindas('👋 Bem-vindo ao Previando! Comece cadastrando seu primeiro cliente para iniciar o atendimento previdenciário.')
        } else if (!data.hasCases) {
          setBoasVindas('📋 Cliente cadastrado! Agora crie um caso para ele selecionando o tipo de benefício previdenciário.')
        } else if (!data.hasCnis) {
          setBoasVindas('📄 Ótimo! O próximo passo é enviar o CNIS do cliente para processamento automático.')
        } else if (!data.hasCalculation) {
          setBoasVindas('🧮 CNIS processado! Agora vá até a calculadora e faça o primeiro cálculo.')
        } else if (!data.hasOpinion) {
          setBoasVindas('⚖️ Cálculo realizado! Gere um parecer jurídico com IA para complementar a análise.')
        } else {
          setBoasVindas('🎉 Você já completou todos os passos! Explore as demais ferramentas como Simulador e Petição Inicial.')
        }
      })
      .catch(() => {
        setBoasVindas('👋 Bem-vindo ao Previando! Vamos te guiar pelos primeiros passos.')
      })
      .finally(() => setLoadingDica(false))

    return () => controller.abort()
  }, [open])

  if (!open) return null

  const steps: OnboardingStep[] = [
    {
      id: 'client',
      icon: <Users className="w-8 h-8 text-amber-600" aria-hidden="true" />,
      title: 'Cadastre um cliente',
      description: boasVindas ?? 'Registre o primeiro segurado para começar a usar o Previando.',
      action: 'Cadastrar Cliente',
      href: '/clients/list',
      dica: '💡 Você pode importar vários clientes de uma vez pela opção "Importar CSV" na página de clientes.',
    },
    {
      id: 'case',
      icon: <FileText className="w-8 h-8 text-amber-600" aria-hidden="true" />,
      title: 'Crie um caso',
      description: 'Cada cliente pode ter um ou mais casos. Crie um caso selecionando o tipo de benefício previdenciário.',
      action: 'Criar Caso',
      href: '/clients/list',
      dica: '💡 O tipo de benefício mais comum é Aposentadoria por Idade. Se tiver dúvida, comece por ele.',
    },
    {
      id: 'cnis',
      icon: <Calculator className="w-8 h-8 text-amber-600" aria-hidden="true" />,
      title: 'Faça upload do CNIS',
      description: 'Baixe o CNIS do seu cliente no Meu INSS e faça o upload para processamento automático com IA.',
      action: 'Upload CNIS',
      href: '/cases',
      dica: '💡 O CNIS é processado automaticamente. Após processado, vá até a Calculadora para simular benefícios.',
    },
  ]

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

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
        {/* Loading state */}
        {loadingDica && (
          <div className="flex items-center gap-2 text-amber-600 mb-4">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-medium">Personalizando sua experiência...</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {steps.map((s, i) => (
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
              {i < steps.length - 1 && <span className="w-6 h-px bg-slate-200" />}
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
          {step.dica && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">{step.dica}</p>
            </div>
          )}
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
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
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
