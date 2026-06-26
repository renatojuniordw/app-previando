'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Building2 } from 'lucide-react'

interface CaseBpcDrawerProps {
  open: boolean
  onClose: () => void
  caseId: string
}

interface BpcAnalysis {
  preAnalise: string | null
  analiseLaudo: string | null
  perguntasSocial: string | null
  perguntasMedicas: string | null
  checklist: string | null
  updatedAt: string
}

const SECTIONS = [
  { key: 'preAnalise' as const, label: 'Pré-Análise de Viabilidade' },
  { key: 'analiseLaudo' as const, label: 'Análise de Laudo' },
  { key: 'perguntasSocial' as const, label: 'Perguntas — Avaliação Social' },
  { key: 'perguntasMedicas' as const, label: 'Perguntas — Perícia Médica' },
  { key: 'checklist' as const, label: 'Checklist de Documentação' },
]

export function CaseBpcDrawer({ open, onClose, caseId }: CaseBpcDrawerProps) {
  const [analysis, setAnalysis] = useState<BpcAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!caseId) return
    setLoading(true)
    api.get(`/cases/${caseId}/bpc`)
      .then((r) => setAnalysis(r.data.analysis ?? null))
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const available = analysis
    ? SECTIONS.filter((s) => analysis[s.key])
    : []

  return (
    <Drawer open={open} onClose={onClose} title="Análises BPC/LOAS" description="Resultados salvos das análises com IA para este caso.">
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
                <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
                <div className="h-8 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : available.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-sm text-slate-900 mb-1">Sem análises geradas</h3>
            <p className="font-sans text-xs text-slate-500 max-w-[200px] mx-auto">
              Use a aba BPC/LOAS do caso para gerar análises com IA.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="purple">{available.length} análise{available.length !== 1 ? 's' : ''}</Badge>
              {analysis?.updatedAt && (
                <span className="text-[10px] font-mono text-slate-400">
                  Atualizado {new Date(analysis.updatedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>

            {available.map((section) => {
              const isOpen = expanded === section.key
              const content = analysis![section.key]!
              return (
                <Card key={section.key} variant="light" className="p-0 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : section.key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="font-sans font-medium text-sm text-slate-800">{section.label}</span>
                    </div>
                    <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100">
                      <div className="px-4 py-3">
                        <p className="font-sans text-xs text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-[15]">
                          {content}
                        </p>
                      </div>
                      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(content)}
                          className="text-[11px] font-sans font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Drawer>
  )
}
