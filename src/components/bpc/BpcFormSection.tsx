'use client'

import { useState } from 'react'
import { BpcForm } from '@/components/bpc/BpcForm'
import { Card } from '@/components/ui/Card'

interface BpcFormSectionProps {
  caseId: string
  clientBirthDate?: string | null
  analysis: {
    id: string
    patologia: string
    cid: string | null
    idade: number
    faixaEtaria: string
    rendaFamiliar: number
    membrosGrupo: number
    rendaPerCapita: number
    barreiras: string | null
    resumoLaudos: string | null
    preAnalise: string | null
    analiseLaudo: string | null
    perguntasSocial: string | null
    perguntasMedicas: string | null
    checklist: string | null
  } | null
  onSave: (data: any) => Promise<void>
}

export function BpcFormSection({ caseId, clientBirthDate, analysis, onSave }: BpcFormSectionProps) {
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (data: any) => {
    setSaving(true)
    try {
      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="light" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif font-semibold text-lg text-slate-900">Dados do Caso</h3>
          <p className="font-sans text-sm text-slate-500 mt-0.5">
            {analysis ? 'Clique para editar os dados do caso' : 'Preencha os dados para iniciar a análise'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          {showForm ? 'Fechar' : analysis ? 'Editar' : 'Preencher'}
        </button>
      </div>

      {showForm && (
        <BpcForm caseId={caseId} clientBirthDate={clientBirthDate ?? null} analysis={analysis} onSave={handleSave} saving={saving} />
      )}
    </Card>
  )
}
