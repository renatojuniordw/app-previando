'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem {
  question: string
  answer: string
}

interface Props {
  token: string
}

export function PortalFaq({ token }: Props) {
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/portal/${token}/faq`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setFaqs(data.faqs || [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [token])

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      </div>
    )
  }

  if (error || faqs.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
        <span className="font-sans text-sm font-medium uppercase tracking-wide">
          Perguntas Frequentes
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between gap-2 py-3 text-left"
            >
              <span className="font-sans text-sm font-semibold text-slate-700 flex-1">
                {faq.question}
              </span>
              {openIndex === i ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                openIndex === i ? 'max-h-96 pb-3' : 'max-h-0'
              )}
            >
              <p className="font-sans text-sm text-slate-500 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
