import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError, PlanLimitError } from '@/lib/api-error'
import { getPlanLimit } from '@/lib/plan-guard'
import { logAudit } from '@/lib/audit'
import { Logger } from '@/lib/logger'
import { enviarParaAssinatura, baixarDocumentoAssinado } from '@/services/assinatura-digital'

const logger = new Logger('CaseAssinatura')

const startSignatureSchema = z.object({
  tipoDocumento: z.enum(['PROCURACAO', 'PETICAO', 'CONTRATO']),
  documentoBase64: z.string().min(1, 'Documento PDF em base64 é obrigatório'),
  signers: z.array(z.object({
    name: z.string().min(1, 'Nome do signatário é obrigatório'),
    email: z.string().email('Email inválido'),
  })).min(1, 'Pelo menos um signatário é obrigatório'),
})

/**
 * GET /api/cases/[id]/assinatura
 * Lista todas as assinaturas do caso.
 * Suporta ?download=<assinaturaId> para baixar o documento assinado.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    await verifyCaseOwnership(params.id, session.user.id)

    // Download de documento assinado
    const downloadId = req.nextUrl.searchParams.get('download')
    if (downloadId) {
      const assinatura = await prisma.assinatura.findFirst({
        where: { id: downloadId, caseId: params.id },
      })

      if (!assinatura) {
        return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
      }

      if (assinatura.status !== 'SIGNED') {
        return NextResponse.json(
          { error: 'Documento ainda não foi assinado por todos os signatários.' },
          { status: 400 }
        )
      }

      const pdfBuffer = await baixarDocumentoAssinado(assinatura.processoKey)
      const pdfArray = new Uint8Array(pdfBuffer)

      return new NextResponse(pdfArray, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="documento-assinado-${assinatura.id}.pdf"`,
        },
      })
    }

    const assinaturas = await prisma.assinatura.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assinaturas })
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * POST /api/cases/[id]/assinatura
 * Inicia o processo de assinatura digital.
 * O documento PDF deve ser enviado como base64 no campo documentoBase64.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    await verifyCaseOwnership(params.id, session.user.id)

    // Verificar permissão do plano
    const planLimits = await getPlanLimit(session.user.plan)
    if (!planLimits.assinaturaEnabled) {
      throw new PlanLimitError(
        'Assinatura Digital não disponível no seu plano.',
        'assinaturaEnabled',
        'SOLO'
      )
    }

    const parsed = startSignatureSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { tipoDocumento, documentoBase64, signers } = parsed.data

    // Validar que o base64 é um PDF válido
    const documentBuffer = Buffer.from(documentoBase64, 'base64')
    if (documentBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Documento PDF inválido ou vazio.' },
        { status: 400 }
      )
    }

    logger.info(`Enviando documento ${tipoDocumento} para assinatura. Caso: ${params.id}`)

    const result = await enviarParaAssinatura({
      caseId: params.id,
      tipoDocumento,
      documentBuffer,
      signers,
    })

    // Salvar no banco de dados
    const assinatura = await prisma.assinatura.create({
      data: {
        caseId: params.id,
        tipoDocumento,
        processoKey: result.processoKey,
        signUrl: result.signUrl,
        status: 'PENDING',
        signers,
      },
    })

    // Registrar auditoria (fire-and-forget)
    logAudit({
      userId: session.user.id,
      action: 'ASSINATURA_ENVIADA',
      resource: 'Assinatura',
      req,
      metadata: { caseId: params.id, tipoDocumento, assinaturaId: assinatura.id },
    }).catch(() => {})

    logger.info(`Assinatura criada: ${assinatura.id} | processoKey: ${result.processoKey}`)

    return NextResponse.json({
      assinatura: {
        id: assinatura.id,
        processoKey: result.processoKey,
        signUrl: result.signUrl,
        status: assinatura.status,
        tipoDocumento: assinatura.tipoDocumento,
        createdAt: assinatura.createdAt,
        signers: assinatura.signers,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
