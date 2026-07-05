import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
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

    // Fonte de verdade da autorização: a tabela Document, nunca a própria
    // string da chave R2 (que é dado de exibição, não deveria carregar
    // autoridade — ver M5 do audit de segurança).
    const document = await prisma.document.findUnique({
      where: { r2Key: key },
      select: { caseId: true, userId: true },
    })

    if (document) {
      if (session.user.id !== document.userId) {
        try {
          await verifyCaseOwnership(document.caseId, session.user.id)
        } catch {
          return NextResponse.json({ error: 'Acesso negado ao documento.' }, { status: 403 })
        }
      }
    } else {
      // Compatibilidade com documentos enviados antes da tabela Document existir:
      // a chave legada tem o formato "documents/${userId}/${caseId}/${timestamp}_${nome}"
      const parts = key.split('/')
      if (parts.length < 4 || parts[0] !== 'documents') {
        return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
      }

      const [, legacyOwnerUserId, legacyCaseId] = parts

      if (session.user.id !== legacyOwnerUserId) {
        try {
          await verifyCaseOwnership(legacyCaseId, session.user.id)
        } catch {
          return NextResponse.json({ error: 'Acesso negado ao documento.' }, { status: 403 })
        }
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
