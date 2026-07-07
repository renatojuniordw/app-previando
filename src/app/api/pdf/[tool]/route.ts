import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: { tool: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { success: limitOk } = await rateLimit(`pdf:user:${session.user.id}`, 20, 3600)
    if (!limitOk) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
    }

    const { tool } = params
    const allowedTools = ['compress', 'merge', 'split', 'from-jpg', 'to-markdown']
    if (!allowedTools.includes(tool)) {
      return NextResponse.json({ error: 'Ferramenta inválida.' }, { status: 400 })
    }

    const formData = await req.formData()
    
    // Opcional: Adicionar honeypot de segurança se necessário
    const backendUrl = `https://pdf.unificando.com.br/api/pdf/${tool}`
    
    const headers: Record<string, string> = {}
    if (process.env.PDF_UNIFICANDO_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.PDF_UNIFICANDO_API_KEY}`
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        return NextResponse.json(
          { error: errorJson?.error?.message || 'Erro ao processar PDF no servidor externo.' },
          { status: response.status }
        )
      } catch {
        return NextResponse.json(
          { error: `Erro externo do servidor de PDF (${response.status}).` },
          { status: response.status }
        )
      }
    }

    const blob = await response.blob()
    const responseHeaders = new Headers()
    
    // Propagar cabeçalhos úteis
    const contentType = response.headers.get('Content-Type')
    const contentDisposition = response.headers.get('Content-Disposition')
    
    if (contentType) responseHeaders.set('Content-Type', contentType)
    if (contentDisposition) responseHeaders.set('Content-Disposition', contentDisposition)

    return new NextResponse(blob, {
      status: 200,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error('[API Proxy PDF Error]:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar o documento.' },
      { status: 500 }
    )
  }
}
