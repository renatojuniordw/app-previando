import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSignedDownloadUrl } from '@/services/r2'
import { verifyCaseOwnership } from '@/lib/ownership'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Chave do documento ausente.' }, { status: 400 })
    }

    // A chave R2 gerada por uploadDocument tem o formato:
    // "documents/${userId}/${caseId}/${timestamp}_${normalizedName}"
    const parts = key.split('/')
    if (parts.length < 4 || parts[0] !== 'documents') {
      return NextResponse.json({ error: 'Chave de documento inválida.' }, { status: 400 })
    }

    const ownerUserId = parts[1]
    const caseId = parts[2]

    // Garantir que o usuário atual é o proprietário do arquivo ou tem acesso ao caso
    if (session.user.id !== ownerUserId) {
      // Como fallback de segurança, verificar se ele é dono do caso associado
      try {
        await verifyCaseOwnership(caseId, session.user.id)
      } catch {
        return NextResponse.json({ error: 'Acesso negado ao documento.' }, { status: 403 })
      }
    }

    // Gerar a URL assinada segura com expiração de 15 minutos (900 segundos)
    const signedUrl = await getSignedDownloadUrl(key)

    // Redirecionar o navegador do usuário direto para a URL assinada do Cloudflare R2
    return NextResponse.redirect(signedUrl)
  } catch (err) {
    console.error('[API Document Download Error]:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar o download do documento.' },
      { status: 500 }
    )
  }
}
