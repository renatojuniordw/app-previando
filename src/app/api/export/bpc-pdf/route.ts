import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateBpcPDF, generateBpcConsolidatedPDF } from '@/lib/pdf-generator'
import { guardFeature } from '@/lib/plan-guard'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await guardFeature(session.user.plan, 'EXPORT_PDF')

    const body = await request.json()
    const { result, type, sections, generatedAt } = body

    let pdfBuffer: Buffer

    if (sections) {
      pdfBuffer = await generateBpcConsolidatedPDF({
        sections,
        generatedAt: generatedAt || new Date().toLocaleDateString('pt-BR'),
      })
    } else {
      if (!result || !type) {
        return NextResponse.json({ error: 'result e type são obrigatórios' }, { status: 400 })
      }
      pdfBuffer = await generateBpcPDF({
        result,
        type: type as 'BPC' | 'LOAS' | 'BPC/LOAS',
        generatedAt: generatedAt || new Date().toLocaleDateString('pt-BR'),
      })
    }

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="previando-bpc.pdf"`,
      },
    })
  } catch (err) {
    console.error('[bpc-pdf]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 })
  }
}
