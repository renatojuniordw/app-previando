'use client'

import { useState } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import Input from '@/components/ui/Input'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve ter ao menos um número'),
  oabNumber: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Erro ao criar conta.')
        return
      }

      // Auto-login após cadastro
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: '/dashboard',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="font-serif font-bold text-3xl text-slate-900 mb-2">
          Criar conta grátis
        </h2>
        <p className="font-sans text-slate-600">
          Sem cartão de crédito · Plano FREE para sempre
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg font-sans font-medium text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-sans font-medium hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 mb-6"
      >
        {googleLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            Conectando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Cadastrar com Google
          </span>
        )}
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 border-t border-slate-100" />
        <span className="font-sans text-xs font-semibold text-slate-400 uppercase tracking-widest">Ou use seu email</span>
        <div className="flex-1 border-t border-slate-100" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome completo"
          {...register('name')}
          placeholder="Dr. João da Silva"
          error={errors.name?.message}
          disabled={loading}
        />

        <Input
          label="Email profissional"
          type="email"
          {...register('email')}
          placeholder="advogado@escritorio.com.br"
          error={errors.email?.message}
          disabled={loading}
        />

        <Input
          label="Número OAB <span className='text-slate-400 font-normal'>(opcional)</span>"}
          {...register('oabNumber')}
          placeholder="SP 123456"
          disabled={loading}
        />

        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
            error={errors.password?.message}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 mt-4"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Criando conta...
            </>
          ) : (
            <>
              Começar grátis
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-center font-sans text-sm text-slate-600 mt-8">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-amber-600 font-semibold hover:text-amber-700 transition-colors">
          Entrar na Plataforma
        </Link>
      </p>
    </div>
  )
}
