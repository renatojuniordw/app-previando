'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff, Lock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorKey, setErrorKey] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        remember: data.remember ?? false,
        redirect: false,
      })
      if (result?.error) {
        setError('Email ou senha incorretos.')
        setErrorKey((k) => k + 1)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
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
        <h1 className="font-serif font-bold text-3xl text-slate-900 mb-2">
          Bem-vindo de volta
        </h1>
        <p className="font-sans text-slate-600">
          Acesse sua conta para continuar gerenciando seus casos.
        </p>
      </div>

      {error && (
        <div
          key={errorKey}
          role="alert"
          className={cn(
            'mb-6 p-4 bg-red-50 border border-red-200 rounded-lg font-sans font-medium text-sm text-red-600 flex items-start gap-2',
            'animate-slide-down'
          )}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className={cn(
          'w-full flex items-center justify-center gap-3 px-4 min-h-[44px] bg-white border border-slate-200 rounded-lg text-slate-700 font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-6',
          googleLoading
            ? 'opacity-70 cursor-not-allowed'
            : 'hover:bg-slate-50 hover:text-slate-900 hover:shadow-elevation-md active:shadow-sm active:translate-y-px'
        )}
      >
        {googleLoading ? (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="text-slate-200" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-slate-500" />
            </svg>
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
            Continuar com Google
          </span>
        )}
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 border-t border-slate-100" />
        <span className="font-sans text-xs font-semibold text-slate-400 uppercase tracking-widest">Ou use seu email</span>
        <div className="flex-1 border-t border-slate-100" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email profissional"
          type="email"
          autoFocus
          autoComplete="email"
          {...register('email')}
          placeholder="advogado@escritorio.com.br"
          error={errors.email?.message}
          disabled={loading}
        />

        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[30px] min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              {...register('remember')}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/50 focus:ring-offset-1 cursor-pointer"
            />
            <span className="font-sans text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
              Lembrar-me
            </span>
          </label>

          <Link
            href="/forgot-password"
            className="flex items-center gap-1.5 font-sans text-sm text-amber-700 hover:text-amber-800 font-semibold transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          aria-busy={loading}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2',
            loading && 'animate-pulse'
          )}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar na Plataforma
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-8">
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 px-6 min-h-[44px] border-2 border-amber-600 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          Ainda não tem conta? Cadastre-se grátis
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
