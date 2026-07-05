import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { uploadDocument } from '@/services/r2'
import { mapNoteTypeToDb } from '@/lib/mappers'
import { sanitizeInput } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: { id: string; tool: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id: caseId, tool } = params
    
    // Validar propriedade do caso
    await verifyCaseOwnership(caseId, session.user.id)

    const allowedTools = ['compress', 'merge', 'split', 'from-jpg', 'to-markdown']
    if (!allowedTools.includes(tool)) {
      return NextResponse.json({ error: 'Ferramenta inválida.' }, { status: 400 })
    }

    const formData = await req.formData()
    
    // Obter o nome do primeiro arquivo para referência
    const file = formData.get('file') as File | null
    let referenceFilename = 'documento.pdf'
    if (file && typeof file !== 'string') {
      referenceFilename = file.name
    }

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

    const contentType = response.headers.get('Content-Type') || 'application/pdf'
    const contentDisposition = response.headers.get('Content-Disposition') || `attachment; filename="processado_${referenceFilename}"`
    
    // Extrair o nome de arquivo retornado pela API ou usar o de referência
    let outputFilename = `processado_${referenceFilename}`
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
    if (filenameMatch && filenameMatch[1]) {
      outputFilename = filenameMatch[1]
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 1. Fazer upload para o R2 do Previando
    const r2Key = await uploadDocument(buffer, session.user.id, caseId, outputFilename, contentType)

    // Registro de ownership no banco — o download nunca mais confia em
    // dono/caso extraídos da própria string da chave R2 (ver M5 do audit)
    await prisma.document.create({
      data: { caseId, userId: session.user.id, r2Key, fileName: outputFilename, contentType },
    })

    // 2. Calcular informações de tamanho para o prontuário
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 3. Montar a descrição da nota do prontuário
    let toolNamePT = tool
    if (tool === 'compress') toolNamePT = 'Comprimir PDF'
    if (tool === 'merge') toolNamePT = 'Juntar PDF'
    if (tool === 'split') toolNamePT = 'Dividir PDF'
    if (tool === 'from-jpg') toolNamePT = 'Converter Imagens em PDF'
    if (tool === 'to-markdown') toolNamePT = 'Converter PDF para Markdown'

    let noteContent = `[Ferramenta de PDF] Documento processado com sucesso.
Ferramenta: ${toolNamePT}
Nome do Arquivo: ${outputFilename}
Tamanho: ${formatBytes(buffer.length)}`

    // Se for compressão, tentar ler metadados de tamanho dos headers do pdf-unificando
    const originalSizeHeader = response.headers.get('X-Original-Size')
    const compressedSizeHeader = response.headers.get('X-Compressed-Size')
    if (originalSizeHeader && compressedSizeHeader) {
      const orig = Number(originalSizeHeader)
      const comp = Number(compressedSizeHeader)
      const reduction = ((orig - comp) / orig * 100).toFixed(1)
      noteContent += `\nTamanho Original: ${formatBytes(orig)}\nTamanho Comprimido: ${formatBytes(comp)} (Redução de ${reduction}%)`
    }

    noteContent += `\nChave de armazenamento: ${r2Key}`

    // 4. Calcular próximo número de versão sequencial do prontuário
    const lastNote = await prisma.caseNote.findFirst({
      where: { caseId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = (lastNote?.version ?? 0) + 1

    // 5. Criar registro de nota de prontuário (tipo DOCUMENTO)
    const note = await prisma.caseNote.create({
      data: {
        caseId,
        userId: session.user.id,
        type: mapNoteTypeToDb('DOCUMENTO'),
        content: sanitizeInput(noteContent),
        version,
      },
    })

    // 6. Registrar auditoria
    await logAudit({
      userId: session.user.id,
      action: 'pdf.processed',
      resource: `PDF processado e anexado ao prontuário (${toolNamePT})`,
      req,
      metadata: { caseId, noteId: note.id, key: r2Key },
    })

    // 7. Retornar o arquivo binário para download imediato do usuário
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', contentType)
    responseHeaders.set('Content-Disposition', contentDisposition)

    return new NextResponse(buffer, {
      status: 200,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error('[API Case PDF Proxy Error]:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar e salvar o documento no caso.' },
      { status: 500 }
    )
  }
}
