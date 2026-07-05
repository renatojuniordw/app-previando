'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import {
  Globe,
  Check,
  X,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react'
import type { CaseDetail } from '../_types'
import { cn } from '@/lib/utils'

interface Props {
  caseId: string
  portalConfig: CaseDetail['portalConfig']
  onUpdate: () => void
}

const CONFIG_ITEMS: Array<{
  key: keyof NonNullable<CaseDetail['portalConfig']>
  label: string
  description: string
}> = [
  {
    key: 'showCalculations',
    label: 'Meus cálculos',
    description: 'RMI, RMA e modalidades selecionadas',
  },
  {
    key: 'showRetroactives',
    label: 'Retroativos',
    description: 'Valores devidos e projeções financeiras',
  },
  {
    key: 'showInterpretation',
    label: 'Interpretação com IA',
    description: 'Classificação de urgência das movimentações',
  },
]

export function PortalConfigCard({ caseId, portalConfig, onUpdate: _onUpdate }: Props) {
  const [config, setConfig] = useState<NonNullable<CaseDetail['portalConfig']>>(
    portalConfig ?? {
      showCalculations: true,
      showRetroactives: false,
      showInterpretation: false,
      requireIdentity: false,
    }
  )
  const [saving, setSaving] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [loadingLink, setLoadingLink] = useState(false)

  const anyEnabled = Object.values(config).some(Boolean)

  const toggle = async (key: keyof typeof config) => {
    const newConfig = { ...config, [key]: !config[key] }
    setConfig(newConfig)

    setSaving(true)
    try {
      await api.patch(`/cases/${caseId}/portal/config`, { [key]: newConfig[key] })
    } catch {
      setConfig(config)
    } finally {
      setSaving(false)
    }
  }

  const generateLink = async () => {
    setLoadingLink(true)
    try {
      const r = await api.post(`/cases/${caseId}/portal`)
      setLink(r.data.link)
    } catch {
      setLink(null)
    } finally {
      setLoadingLink(false)
    }
  }

  return (
    <Card variant="light" className="p-0 overflow-hidden border-slate-200/80 shadow-sm bg-white">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-550 shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900 tracking-tight">Portal do Cliente</h3>
            <p className="font-sans text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" /> salvando...
                </span>
              ) : (
                'Compartilhamento e Acesso'
              )}
            </p>
          </div>
        </div>
        <div>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Portal
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={generateLink}
              loading={loadingLink}
              className="font-sans font-bold text-xs h-9.5"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Gerar Link
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {!anyEnabled && (
          <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl">
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Nenhuma informação está configurada como visível para o cliente no momento. Ative pelo menos uma das opções de compartilhamento para que o portal funcione corretamente.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1">
            Informações Disponibilizadas
          </p>
          <div className="grid grid-cols-1 gap-3">
            {CONFIG_ITEMS.map(({ key, label, description }) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50/40 transition-all duration-300 text-left group"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                    config[key]
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-200 group-hover:border-slate-350'
                  )}
                >
                  {config[key] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-bold leading-tight", config[key] ? 'text-slate-800' : 'text-slate-400')}>
                    {label}
                  </p>
                  <p className={cn("text-xs mt-1 font-medium", config[key] ? 'text-slate-500' : 'text-slate-400')}>
                    {description}
                  </p>
                </div>
                {config[key] ? (
                  <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {link && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-sans text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2">
              Link de Acesso Direto
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-250 truncate font-mono">
                {link}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="shrink-0 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-250 rounded-lg hover:border-slate-350 hover:bg-slate-50 transition-colors h-9.5 shadow-xs"
              >
                Copiar
              </button>
            </div>
          </div>
        )}

        {/* Verificação de identidade */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <button
            onClick={() => toggle('requireIdentity' as keyof typeof config)}
            className="w-full flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50/40 transition-all duration-300 text-left group"
          >
            <div
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                config.requireIdentity
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-slate-200 group-hover:border-slate-350'
              )}
            >
              {config.requireIdentity ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3 h-3 text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-bold leading-tight", config.requireIdentity ? 'text-slate-800' : 'text-slate-400')}>
                Exigir verificação de identidade
              </p>
              <p className={cn("text-xs mt-1 font-medium", config.requireIdentity ? 'text-slate-500' : 'text-slate-400')}>
                Cliente informa CPF + data de nascimento para acessar dados sensíveis (retroativos, cálculos)
              </p>
            </div>
            <Shield className={cn("w-4 h-4 shrink-0", config.requireIdentity ? 'text-amber-500' : 'text-slate-300')} />
          </button>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
          O cliente acessa os dados via link único com validade de 30 dias. Respeita a LGPD — você controla exatamente o que é compartilhado.
        </p>
      </div>
    </Card>
  )
}
