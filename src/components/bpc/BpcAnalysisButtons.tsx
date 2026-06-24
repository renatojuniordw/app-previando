'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type AnalysisType = 'preAnalise' | 'laudo' | 'social' | 'medical' | 'checklist' | null

interface BpcAnalysisButtonsProps {
  onAnalyze: (type: AnalysisType) => void
  onOpenLaudo: () => void
  loading: boolean
  disabled: boolean
}

export function BpcAnalysisButtons({ onAnalyze, onOpenLaudo, loading, disabled }: BpcAnalysisButtonsProps) {
  return (
    <Card variant="light" className="p-6">
      <h3 className="font-sans font-semibold text-sm text-slate-900 mb-4">Análises com IA</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="primary"
          onClick={() => onAnalyze('preAnalise')}
          loading={loading}
          disabled={disabled}
          className="justify-start text-sm"
        >
          {disabled ? '🔒' : '🔍'} Pré-Análise de Viabilidade
        </Button>

        <Button
          variant="primary"
          onClick={onOpenLaudo}
          disabled={disabled}
          className="justify-start text-sm"
        >
          {disabled ? '🔒' : '📋'} Analisar Laudo
        </Button>

        <Button
          variant="primary"
          onClick={() => onAnalyze('social')}
          loading={loading}
          disabled={disabled}
          className="justify-start text-sm"
        >
          {disabled ? '🔒' : '🗣'} Perguntas: Avaliação Social
        </Button>

        <Button
          variant="primary"
          onClick={() => onAnalyze('medical')}
          loading={loading}
          disabled={disabled}
          className="justify-start text-sm"
        >
          {disabled ? '🔒' : '⚕️'} Perguntas: Perícia Médica
        </Button>

        <Button
          variant="primary"
          onClick={() => onAnalyze('checklist')}
          loading={loading}
          disabled={disabled}
          className="justify-start text-sm"
        >
          {disabled ? '🔒' : '✅'} Checklist de Documentação
        </Button>
      </div>
    </Card>
  )
}
