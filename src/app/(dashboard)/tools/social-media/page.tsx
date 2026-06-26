'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Slide {
  numero: number
  titulo: string
  conteudo: string
}

function parseSlides(raw: string): Slide[] {
  const blocks = raw.split(/\n(?=SLIDE\s+\d+|Slide\s+\d+|\d+\.\s)/i).filter(Boolean)
  return blocks.map((block, i) => {
    const lines = block.trim().split('\n').filter(Boolean)
    const header = lines[0] ?? `Slide ${i + 1}`
    const body = lines.slice(1).join('\n').trim()
    return { numero: i + 1, titulo: header, conteudo: body }
  })
}

export default function SocialMediaPage() {
  const [tema, setTema] = useState('')
  const [contexto, setContexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [rawResult, setRawResult] = useState<string | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [activeSlide, setActiveSlide] = useState(0)

  const handleGenerate = async () => {
    if (!tema.trim()) return
    setLoading(true)
    try {
      const r = await api.post('/tools/social-media', { tema, contexto })
      const raw: string = r.data.result
      setRawResult(raw)
      setSlides(parseSlides(raw))
      setActiveSlide(0)
    } catch {
      // error handled by api interceptor
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAll = () => {
    if (rawResult) navigator.clipboard.writeText(rawResult)
  }

  const handleCopySlide = (slide: Slide) => {
    navigator.clipboard.writeText(`${slide.titulo}\n\n${slide.conteudo}`)
  }

  const handleExportPdf = () => {
    if (!rawResult) return
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(`
        <html><head><title>Carrossel — ${tema}</title>
        <style>body{font-family:monospace;padding:20px;white-space:pre-wrap;line-height:1.6;font-size:13px;}</style>
        </head><body>${rawResult.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>
      `)
      win.document.close()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-serif font-semibold text-xl text-slate-900">Gerador de Carrossel Instagram</h1>
        <p className="font-sans text-sm text-slate-500 mt-1">Crie conteúdo educativo sobre BPC/LOAS para redes sociais</p>
      </div>

      {/* FORMULÁRIO */}
      <Card variant="light" className="p-6 space-y-4">
        <div>
          <label className="neo-label">Tema do carrossel</label>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="w-full neo-input-neo px-3 py-2 font-sans text-sm rounded-md"
            placeholder="Ex: BPC/LOAS para crianças com autismo"
            maxLength={500}
          />
        </div>

        <div>
          <label className="neo-label">Contexto <span className="text-slate-400 font-normal">(opcional)</span></label>
          <textarea
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            className="w-full neo-input-neo px-3 py-2 font-sans text-sm rounded-md min-h-[100px] resize-none"
            placeholder="Informações adicionais, tom desejado, público-alvo específico..."
            maxLength={3000}
          />
        </div>

        <Button
          onClick={handleGenerate}
          loading={loading}
          disabled={!tema.trim()}
          className="w-full"
        >
          Gerar carrossel
        </Button>
      </Card>

      {/* RESULTADO */}
      {slides.length > 0 && (
        <Card variant="light" className="p-0 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex align-items-center justify-content-between">
            <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-400">
              CARROSSEL — {slides.length} SLIDES
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyAll} className="text-xs py-1.5 px-3">
                📋 Copiar tudo
              </Button>
              <Button variant="outline" onClick={handleExportPdf} className="text-xs py-1.5 px-3">
                📄 PDF
              </Button>
            </div>
          </div>

          {/* NAVEGAÇÃO DE SLIDES */}
          <div className="flex overflow-x-auto gap-1 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`shrink-0 w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeSlide === i
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-amber-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* SLIDE ATIVO */}
          {slides[activeSlide] && (
            <div className="p-6 space-y-3">
              <div className="flex align-items-start justify-content-between gap-4">
                <p className="font-sans font-semibold text-sm text-slate-900">
                  {slides[activeSlide].titulo}
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleCopySlide(slides[activeSlide])}
                  className="shrink-0 text-xs py-1.5 px-3"
                >
                  📋 Copiar slide
                </Button>
              </div>
              <p className="font-sans text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {slides[activeSlide].conteudo}
              </p>
            </div>
          )}

          {/* AVISO LEGAL */}
          <div className="border-t border-[#F0B09A] bg-[var(--color-primary-tint)] px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-dark)] mb-1">
              ⚠️ AVISO IMPORTANTE
            </p>
            <p className="text-xs font-mono font-bold uppercase text-[var(--color-primary)] tracking-widest leading-relaxed">
              Este conteúdo é gerado por inteligência artificial com base nas informações fornecidas.
              Não substitui análise jurídica profissional. A responsabilidade pela estratégia
              processual é exclusivamente do advogado responsável pelo caso.
              Previando é um produto Unificando.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
