'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Precisa ter ao menos uma maiúscula')
      .regex(/[0-9]/, 'Precisa ter ao menos um número'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem.',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errorKey, setErrorKey] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenState, setTokenState] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'missing'>('loading')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const passwordValue = watch('password')

  // Validar token ao carregar a página
  useEffect(() => {
    if (!token) {
      setTokenState('missing')
      return
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setTokenState('valid')
        } else {
          setTokenState(data.reason === 'expired' ? 'expired' : 'invalid')
        }
      })
      .catch(() => setTokenState('invalid'))
  }, [token])

  // Auto-redirect ao login após 3s no sucesso
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push('/login'), 3000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  if (!token || tokenState === 'missing' || tokenState === 'invalid') {
    return (
      <div className="w-full max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="font-serif font-bold text-2xl text-slate-900 mb-3">Link inválido</h1>
        <p className="font-sans text-slate-600 mb-6">
          Este link de redefinição é inválido ou já foi usado.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 px-6 min-h-[44px] border-2 border-amber-600 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          Solicitar novo link
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (tokenState === 'expired') {
    return (
      <div className="w-full max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="font-serif font-bold text-2xl text-slate-900 mb-3">Link expirado</h1>
        <p className="font-sans text-slate-600 mb-6">
          Este link de redefinição expirou. O prazo de validade é de 1 hora após a solicitação.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 px-6 min-h-[44px] border-2 border-amber-600 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          Solicitar novo link
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (tokenState === 'loading') {
    return (
      <div className="w-full max-w-md text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="font-sans text-slate-500">Verificando link...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <CheckCircle2 className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="font-serif font-bold text-3xl text-slate-900 mb-3">Senha redefinida</h1>
        <p className="font-sans text-slate-600 mb-8">
          Sua senha foi alterada com sucesso. Faça login com a nova senha.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/login')}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-6 min-h-[44px] border-2 border-amber-600 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50'
            )}
          >
            Ir para o login
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="font-sans text-xs text-slate-400 animate-pulse">
            Redirecionando em 3 segundos...
          </p>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const body = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(body.error ?? 'Erro ao redefinir senha.')
        setErrorKey((k) => k + 1)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setErrorKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-serif font-bold text-3xl text-slate-900 mb-2">Nova senha</h1>
        <p className="font-sans text-slate-600">Crie uma senha forte para proteger sua conta.</p>
      </div>

      {error && (
        <div key={errorKey} role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg font-sans font-medium text-sm text-red-600 flex items-start gap-2 animate-slide-down">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="relative">
          <Input
            label="Nova senha"
            type={showPassword ? 'text' : 'password'}
            autoFocus
            autoComplete="new-password"
            {...register('password')}
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {passwordValue && passwordValue.length > 0 && (
          <div className="space-y-1.5 -mt-2">
            {[
              { label: 'Mínimo 8 caracteres', check: passwordValue.length >= 8 },
              { label: '1 letra maiúscula', check: /[A-Z]/.test(passwordValue) },
              { label: '1 número', check: /[0-9]/.test(passwordValue) },
            ].map((req) => (
              <div key={req.label} className="flex items-center gap-1.5">
                {req.check ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className={`font-sans text-xs ${req.check ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Input
            label="Confirmar senha"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="off"
            {...register('confirm')}
            placeholder="••••••••"
            error={errors.confirm?.message}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          aria-busy={loading}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
            loading && 'animate-pulse'
          )}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Salvar nova senha
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
