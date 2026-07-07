import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateBpcPDF, generateBpcConsolidatedPDF, type ClientInfo } from '@/lib/pdf-generator'
import { fetchClientInfo } from '@/lib/fetch-client-info'
import { guardFeature } from '@/lib/plan-guard'
import { verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { PlanLimitError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await guardFeature(session.user.plan, 'EXPORT_PDF')

    const body = await request.json()
    const { result, type, sections, generatedAt, caseId } = body

    let clientName = ''
    let clientInfo: ClientInfo | null = null
    if (caseId) {
      await verifyCaseOwnershipAndActive(caseId, session.user.id)
      clientInfo = await fetchClientInfo(caseId, session.user.id)
      if (clientInfo) clientName = clientInfo.name
    }

    const userName = session.user.name ?? ''

    const firstName = clientName ? clientName.split(' ').slice(0, 2).join('-').toLowerCase() : ''
    const filename = `previando-bpc${firstName ? `-${firstName}` : ''}.pdf`

    const sharedFields = { clientName, userName, clientInfo: clientInfo ?? undefined, generatedAt: generatedAt || new Date().toLocaleDateString('pt-BR') }

    let pdfBuffer: Buffer

    if (sections) {
      pdfBuffer = await generateBpcConsolidatedPDF({
        sections,
        ...sharedFields,
      })
    } else {
      if (!result || !type) {
        return NextResponse.json({ error: 'result e type são obrigatórios' }, { status: 400 })
      }
      pdfBuffer = await generateBpcPDF({
        result,
        type: type as 'BPC' | 'LOAS' | 'BPC/LOAS',
        ...sharedFields,
      })
    }

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: err.message, feature: err.feature, upgradeRequired: err.upgradeRequired },
        { status: 402 }
      )
    }
    console.error('[bpc-pdf]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 })
  }
}
