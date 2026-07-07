'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Headphones, Send, Loader2, CheckCircle2, Mail, Clock, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import api from '@/lib/api'

const schema = z.object({
  subject: z.string().min(5, 'Mínimo 5 caracteres').max(200),
  message: z.string().min(10, 'Mínimo 10 caracteres').max(5000),
})

type FormData = z.infer<typeof schema>

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [sending, setSending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSending(true)
    try {
      const res = await api.post('/support/tickets', {
        subject: data.subject,
        message: data.message,
      })
      setTicketId(res.data.ticket.id)
      setSubmitted(true)
    } catch {
      // Toast is handled by api interceptor
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <ErrorBoundary>
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="bg-white border border-emerald-200 rounded-xl shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-serif font-bold text-2xl text-slate-900">Chamado registrado</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Seu chamado <span className="font-mono font-medium text-slate-800">{ticketId}</span> foi registrado.
              Nossa equipe de suporte vai analisar e responder em até 48 horas úteis.
            </p>
            <p className="text-slate-400 text-xs flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Acompanhe a resposta pelo seu email de cadastro
            </p>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
        <PageHeader
          icon={Headphones}
          title="Suporte"
          description="Envie suas dúvidas, sugestões ou reporte problemas"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="font-sans text-sm font-semibold text-slate-700">Email</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Prefere enviar um email? Escreva para{' '}
                <a href="mailto:contato@previando.com.br" className="text-amber-700 font-semibold hover:text-amber-800 transition-colors">
                  contato@previando.com.br
                </a>
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  Para questões de privacidade e dados pessoais (LGPD), utilize o formulário ou nosso email.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
              <Input
                label="Assunto"
                {...register('subject')}
                placeholder="Ex: Erro ao calcular tempo de contribuição"
                error={errors.subject?.message}
                disabled={sending}
              />

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">Mensagem</label>
                <textarea
                  id="message"
                  {...register('message')}
                  rows={6}
                  placeholder="Descreva detalhadamente o que está acontecendo..."
                  disabled={sending}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y"
                />
                {errors.message && (
                  <p className="mt-1.5 font-sans text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={sending}>
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Chamado
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
