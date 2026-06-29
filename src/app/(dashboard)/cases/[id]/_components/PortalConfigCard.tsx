'use client'

import { useState } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
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
} from 'lucide-react'
import type { CaseDetail } from '../_types'

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
    key: 'showProcessTracking',
    label: 'Acompanhamento processual',
    description: 'Número do processo, últimas movimentações e resumo',
  },
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

const SENSITIVE_KEYS: Array<keyof NonNullable<CaseDetail['portalConfig']>> = [
  'showRetroactives',
  'showCalculations',
]

export function PortalConfigCard({ caseId, portalConfig, onUpdate }: Props) {
  const [config, setConfig] = useState<NonNullable<CaseDetail['portalConfig']>>(
    portalConfig ?? {
      showProcessTracking: true,
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
      // Reverte em caso de erro
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
    <Card variant="light">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <span>Portal do Cliente</span>
            {saving && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                salvando
              </span>
            )}
          </div>
        }
        action={
          link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir portal
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={generateLink}
              loading={loadingLink}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Gerar link
            </Button>
          )
        }
      />

      <div className="p-6 space-y-4">
        {!anyEnabled && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              Nenhuma informação está visível para o cliente. Ative pelo menos uma opção acima.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
            O que o cliente pode ver
          </p>
          {CONFIG_ITEMS.map(({ key, label, description }) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left group"
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  config[key]
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 group-hover:border-slate-400'
                }`}
              >
                {config[key] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3 text-slate-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config[key] ? 'text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </p>
                <p className={`text-xs ${config[key] ? 'text-slate-500' : 'text-slate-400'}`}>
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

        {link && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Link do portal
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-slate-700 bg-white px-2 py-1.5 rounded border border-slate-200 truncate">
                {link}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>
        )}          {/* Verificação de identidade */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => toggle('requireIdentity' as keyof typeof config)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left group"
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  config.requireIdentity
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'border-slate-300 group-hover:border-slate-400'
                }`}
              >
                {config.requireIdentity ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3 h-3 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config.requireIdentity ? 'text-slate-900' : 'text-slate-400'}`}>
                  Exigir verificação de identidade
                </p>
                <p className={`text-xs ${config.requireIdentity ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cliente informa CPF + data de nascimento para acessar dados sensíveis (retroativos, cálculos)
                </p>
              </div>
              <Shield className={`w-4 h-4 shrink-0 ${config.requireIdentity ? 'text-amber-500' : 'text-slate-300'}`} />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            O cliente acessa os dados via link único com validade de 30 dias. Respeita a LGPD — você controla exatamente o que é compartilhado.
          </p>
      </div>
    </Card>
  )
}
