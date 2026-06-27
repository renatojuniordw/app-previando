'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
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
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="w-full max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="font-serif font-bold text-2xl text-slate-900 mb-3">Link inválido</h2>
        <p className="font-sans text-slate-600 mb-6">
          Este link de redefinição é inválido ou já foi usado.
        </p>
        <Link href="/forgot-password" className="text-amber-600 font-semibold hover:text-amber-700 transition-colors">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <CheckCircle2 className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="font-serif font-bold text-3xl text-slate-900 mb-3">Senha redefinida</h2>
        <p className="font-sans text-slate-600 mb-8">
          Sua senha foi alterada com sucesso. Faça login com a nova senha.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Ir para o login
          <ArrowRight className="w-4 h-4" />
        </button>
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
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="font-serif font-bold text-3xl text-slate-900 mb-2">Nova senha</h2>
        <p className="font-sans text-slate-600">Crie uma senha forte para proteger sua conta.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg font-sans font-medium text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="relative">
          <Input
            label="Nova senha"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          label="Confirmar senha"
          type={showPassword ? 'text' : 'password'}
          {...register('confirm')}
          placeholder="••••••••"
          error={errors.confirm?.message}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
