'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MessageCircle, Mail, Copy, Edit3, X, Zap, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ClientFloatingActionsProps {
  clientId: string
  phone?: string | null
  email?: string | null
  cpf: string
  onEdit: () => void
  onCopyCpf: (cpf: string) => void
}

type SendState = 'idle' | 'composing' | 'sending' | 'success' | 'error'

export function ClientFloatingActions({ clientId, phone, email, cpf, onEdit, onCopyCpf }: ClientFloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sendState, setSendState] = useState<SendState>('idle')
  const [message, setMessage] = useState('')
  const [sendError, setSendError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (sendState !== 'composing' && sendState !== 'sending') setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sendState !== 'composing' && sendState !== 'sending') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, sendState])

  const cleanPhone = phone ? phone.replace(/\D/g, '') : ''

  async function handleSendWhatsApp() {
    setSendState('sending')
    setSendError('')
    try {
      const res = await fetch(`/api/clients/${clientId}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (res.ok) {
        setSendState('success')
        setMessage('')
        setTimeout(() => setSendState('idle'), 3000)
      } else {
        const data = await res.json()
        setSendError(data.error ?? 'Falha ao enviar mensagem.')
        setSendState('error')
      }
    } catch {
      setSendError('Erro de conexão.')
      setSendState('error')
    }
  }

  const actions = [
    {
      id: 'edit',
      label: 'Editar Cliente / Notas',
      icon: Edit3,
      color: 'hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 text-slate-600',
      onClick: () => { onEdit(); setIsOpen(false) },
      show: true,
    },
    {
      id: 'copy',
      label: 'Copiar CPF',
      icon: Copy,
      color: 'hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 text-slate-600',
      onClick: () => { onCopyCpf(cpf); setIsOpen(false) },
      show: !!cpf,
    },
    {
      id: 'email',
      label: 'Enviar E-mail',
      icon: Mail,
      color: 'hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-600',
      onClick: () => { window.location.href = `mailto:${email}`; setIsOpen(false) },
      show: !!email,
    },
    {
      id: 'whatsapp-link',
      label: 'Abrir WhatsApp',
      icon: MessageCircle,
      color: 'hover:text-green-600 hover:border-green-200 hover:bg-green-50/50 text-slate-600',
      onClick: () => { window.open(`https://wa.me/55${cleanPhone}`, '_blank'); setIsOpen(false) },
      show: !!cleanPhone,
    },
    {
      id: 'whatsapp-send',
      label: 'Enviar Notificação WA',
      icon: Send,
      color: 'hover:text-green-700 hover:border-green-300 hover:bg-green-100/50 text-slate-600',
      onClick: () => { setSendState('composing'); setIsOpen(false) },
      show: !!cleanPhone,
    },
  ].filter((a) => a.show)

  return (
    <>
      {/* Modal de composição de mensagem WhatsApp */}
      {(sendState === 'composing' || sendState === 'sending' || sendState === 'error' || sendState === 'success') && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-slate-800 text-sm">Notificação via WhatsApp</span>
              </div>
              <button
                onClick={() => { setSendState('idle'); setMessage(''); setSendError('') }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sendState === 'success' ? (
              <div className="flex items-center gap-2 text-green-600 py-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Mensagem enviada com sucesso!</span>
              </div>
            ) : (
              <>
                {sendState === 'error' && (
                  <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{sendError}</span>
                  </div>
                )}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite a mensagem para o cliente..."
                  rows={4}
                  disabled={sendState === 'sending'}
                  className="w-full text-sm rounded-lg border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 disabled:opacity-60 font-sans"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSendState('idle'); setMessage(''); setSendError('') }}
                    className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={!message.trim() || sendState === 'sending'}
                    className="flex-1 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {sendState === 'sending' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Enviar</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div ref={menuRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        <div
          className={cn(
            'flex flex-col items-end gap-3 transition-all duration-300 ease-out origin-bottom transform',
            isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
          )}
        >
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <div key={action.id} className="flex items-center gap-2 group">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-sans font-semibold shadow-md whitespace-nowrap transition-all duration-200 opacity-0 scale-95 origin-right translate-x-2 pointer-events-none',
                    isOpen && 'group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0'
                  )}
                >
                  {action.label}
                </span>
                <button
                  onClick={action.onClick}
                  className={cn(
                    'w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center transition-all duration-200 pointer-events-auto',
                    action.color
                  )}
                  aria-label={action.label}
                  style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-white transition-all duration-300 transform active:scale-95 pointer-events-auto',
            isOpen
              ? 'bg-slate-800 hover:bg-slate-700 rotate-90 scale-95'
              : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 hover:scale-105'
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Ações rápidas do cliente"
        >
          {isOpen ? <X className="w-6 h-6 animate-fade-in" /> : <Zap className="w-6 h-6 animate-fade-in" />}
        </button>
      </div>
    </>
  )
}
