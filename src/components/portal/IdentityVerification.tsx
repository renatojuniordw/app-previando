'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { formatCPF, stripNonDigits } from '@/lib/masks'
import { DatePicker } from '@/components/ui/DatePicker'

interface Props {
  token: string
  onVerified: () => void
}

const VERIFIED_KEY = 'previando_portal_verified'

/**
 * IdentityVerification — pede CPF + data de nascimento antes de liberar
 * dados sensíveis no Portal do Cliente.
 *
 * O estado de verificação fica em sessionStorage — dura apenas a aba.
 * Fecha a aba, precisa verificar de novo.
 */
export function IdentityVerification({ token, onVerified }: Props) {
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCpf, setShowCpf] = useState(false)

  // Se já verificou nesta sessão, nem renderiza
  if (typeof window !== 'undefined' && sessionStorage.getItem(VERIFIED_KEY) === token) {
    return null
  }

  const handleVerify = async () => {
    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('CPF deve ter 11 dígitos.')
      return
    }
    if (!birthDate) {
      setError('Informe a data de nascimento.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/portal/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfDigits, birthDate }),
      })

      const data = await res.json()

      if (data.verified) {
        sessionStorage.setItem(VERIFIED_KEY, token)
        onVerified()
      } else {
        setError(data.error ?? 'Dados não conferem.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-slate-900">Verificação de Identidade</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Para sua segurança, confirme sua identidade antes de acessar os dados completos.
            Suas informações são protegidas e não serão armazenadas.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="font-sans text-xs font-medium text-slate-600 block mb-1">
            CPF
          </label>
          <div className="relative">
            <input
              type={showCpf ? 'text' : 'password'}
              value={formatCPF(cpf)}
              onChange={(e) => setCpf(stripNonDigits(e.target.value).slice(0, 11))}
              placeholder="000.000.000-00"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-sans focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none pr-10"
              maxLength={14}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowCpf(!showCpf)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showCpf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <DatePicker
            label="Data de Nascimento"
            value={birthDate}
            onChange={(d) => setBirthDate(d ? d.toISOString().split('T')[0] : '')}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading || cpf.length !== 11 || !birthDate}
        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
        ) : (
          <><ShieldCheck className="w-4 h-4" /> Confirmar Identidade</>
        )}
      </button>

      <p className="text-[10px] text-slate-400 text-center leading-relaxed">
        Seus dados são validados com hash criptográfico e não ficam armazenados nesta sessão.
      </p>
    </div>
  )
}
