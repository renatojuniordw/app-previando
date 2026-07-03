'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'

const schema = z.object({ email: z.string().email('Email inválido') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const body = await res.json()
        setError(body.error ?? 'Erro ao enviar. Tente novamente.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-amber-500" />
        </div>
        <h2 className="font-serif font-bold text-3xl text-slate-900 mb-3">Email enviado</h2>
        <p className="font-sans text-slate-600 mb-8">
          Se existe uma conta com esse email, você receberá um link para redefinir sua senha em breve.
          Verifique também a caixa de spam.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-sans mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>
        <h1 className="font-serif font-bold text-3xl text-slate-900 mb-2">Esqueceu a senha?</h1>
        <p className="font-sans text-slate-600">
          Informe seu email e enviaremos um link para você criar uma nova senha.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg font-sans font-medium text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          type="email"
          {...register('email')}
          placeholder="advogado@escritorio.com.br"
          error={errors.email?.message}
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
              Enviando...
            </>
          ) : (
            'Enviar link de redefinição'
          )}
        </button>
      </form>
    </div>
  )
}
