'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import {
  Globe, Check, Loader2, ExternalLink, Eye, Shield, ShieldOff,
} from 'lucide-react'
import type { CaseDetail } from '../_types'
import { cn, formatDate } from '@/lib/utils'
import { PortalPreviewModal } from './PortalPreviewModal'
import { DocumentShareList } from './DocumentShareList'

interface Props {
  caseId: string
  benefitType: string
  portalConfig: CaseDetail['portalConfig']
  onUpdate: () => void
}

const BASE_CONFIG_ITEMS: Array<{
  key: 'showCalculations' | 'showRetroactives' | 'showTimeline' | 'showDocuments' | 'showFaq' | 'showGlossary' | 'showPdfExport'
  label: string
  description: string
}> = [
  { key: 'showCalculations', label: 'Meus cálculos', description: 'RMI, RMA e modalidades' },
  { key: 'showRetroactives', label: 'Retroativos', description: 'Valores devidos e projeções' },
  { key: 'showTimeline', label: 'Linha do tempo', description: 'Eventos em ordem cronológica' },
  { key: 'showDocuments', label: 'Documentos do caso', description: 'Arquivos para o cliente' },
  { key: 'showFaq', label: 'Perguntas frequentes', description: 'FAQ sobre o benefício' },
  { key: 'showGlossary', label: 'Glossário de termos', description: 'Termos previdenciários' },
  { key: 'showPdfExport', label: 'Exportar PDF', description: 'Relatório completo' },
]

export function PortalConfigCard({ caseId, benefitType, portalConfig, onUpdate }: Props) {
  const { addToast } = useToast()
  const [config, setConfig] = useState<NonNullable<CaseDetail['portalConfig']>>(
    portalConfig ?? {
      showCalculations: true,
      showRetroactives: false,
      showBpcSocialAnalysis: false,
      showTimeline: false,
      showDocuments: false,
      showFaq: false,
      showGlossary: false,
      showPdfExport: false,
      requireIdentity: false,
    }
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loadingLink, setLoadingLink] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const configItems = benefitType === 'BPC_LOAS'
    ? [
        ...BASE_CONFIG_ITEMS,
        {
          key: 'showBpcSocialAnalysis' as const,
          label: 'Análise socioeconômica (BPC)',
          description: 'Renda familiar e análise social',
        },
      ]
    : BASE_CONFIG_ITEMS

  const anyEnabled = Object.values(config).some(Boolean)

  useEffect(() => {
    let cancelled = false
    api.get(`/cases/${caseId}/portal`).then((r) => {
      if (!cancelled && r.data.link) {
        setLink(r.data.link)
        setExpiresAt(r.data.expiresAt ?? null)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [caseId])

  const toggle = async (key: keyof typeof config) => {
    const newConfig = { ...config, [key]: !config[key] }
    setConfig(newConfig)
    setSaveError(false)
    setSaving(true)
    try {
      await api.patch(`/cases/${caseId}/portal/config`, { [key]: newConfig[key] })
      onUpdate()
    } catch {
      setConfig(config)
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  const generateLink = async () => {
    setLoadingLink(true)
    try {
      const r = await api.post(`/cases/${caseId}/portal`)
      setLink(r.data.link)
      setExpiresAt(r.data.expiresAt ?? null)
      onUpdate()
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao gerar link.'
      addToast({ type: 'error', title: 'Erro', message: msg })
    } finally {
      setLoadingLink(false)
    }
  }

  const revokeLink = async () => {
    if (!window.confirm('Revogar o acesso do cliente a este portal? O link atual deixará de funcionar.')) return
    setLoadingLink(true)
    try {
      await api.delete(`/cases/${caseId}/portal`)
      setLink(null)
      setExpiresAt(null)
      onUpdate()
    } finally {
      setLoadingLink(false)
    }
  }

  return (
    <Card variant="light" className="p-0 overflow-hidden border-slate-200/80 shadow-sm bg-white">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900 tracking-tight">Portal do Cliente</h3>
            <p className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" /> salvando...
                </span>
              ) : 'Compartilhamento e Acesso'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Portal
            </a>
          ) : (
            <button
              onClick={generateLink}
              disabled={loadingLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {loadingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              Gerar Link
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-700 font-medium">Não foi possível salvar. Tente novamente.</p>
          </div>
        )}

        {!anyEnabled && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800 font-medium">Nenhuma informação visível no momento. Ative pelo menos uma opção.</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            Informações Disponibilizadas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {configItems.map(({ key, label, description }) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  config[key]
                    ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                    config[key]
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300'
                  )}
                >
                  {config[key] ? <Check className="w-3.5 h-3.5" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold leading-tight", config[key] ? 'text-slate-800' : 'text-slate-500')}>
                    {label}
                  </p>
                  <p className="text-[10px] mt-0.5 text-slate-400 font-medium leading-relaxed">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => toggle('requireIdentity')}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all text-left flex-1",
              config.requireIdentity
                ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                config.requireIdentity
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-slate-300'
              )}
            >
              {config.requireIdentity ? <Check className="w-3.5 h-3.5" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-bold leading-tight", config.requireIdentity ? 'text-slate-800' : 'text-slate-500')}>
                {config.requireIdentity ? 'Identidade exigida' : 'Exigir verificação de identidade'}
              </p>
              <p className="text-[10px] mt-0.5 text-slate-400 font-medium leading-relaxed">
                CPF + data de nascimento para acessar dados sensíveis
              </p>
            </div>
            {config.requireIdentity ? (
              <Shield className="w-4 h-4 shrink-0 text-amber-500" />
            ) : (
              <ShieldOff className="w-4 h-4 shrink-0 text-slate-300" />
            )}
          </button>

          {link && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex-1">
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Link Ativo</p>
                {expiresAt && (
                  <p className="font-sans text-[10px] text-slate-400">Válido até {formatDate(expiresAt)}</p>
                )}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(link!)}
                className="shrink-0 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Copiar
              </button>
              <button
                onClick={revokeLink}
                className="shrink-0 px-3 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Revogar
              </button>
            </div>
          )}
        </div>

        {config.showDocuments && (
          <div className="pt-3 border-t border-slate-100">
            <DocumentShareList caseId={caseId} />
          </div>
        )}

        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
          Link único com validade de 30 dias. Respeita a LGPD — você controla o que é compartilhado.
        </p>
      </div>

      {showPreview && (
        <PortalPreviewModal caseId={caseId} config={config} onClose={() => setShowPreview(false)} />
      )}
    </Card>
  )
}
