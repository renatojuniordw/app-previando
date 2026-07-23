import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { hashCPF } from '@/lib/sanitize-server'
import { isValidCPF } from '@/lib/cpf'
import { handleApiError } from '@/lib/api-error'
import { CaseImportRowSchema, parsePreviewCSV, parsePreviewExcel } from '@/lib/case-import-parser'

interface PreviewRow {
  linha: number
  cliente_nome: string
  cliente_cpf: string
  beneficio: string
  status: string
  prazo_dias: string
  observacoes: string
  valido: boolean
  erro?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { success: limitOk } = await rateLimit(`case-import-preview:${session.user.id}`, 10, 3600)
    if (!limitOk) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2MB.' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    let previewRows: Record<string, unknown>[]

    if (isExcel) {
      const buffer = await file.arrayBuffer()
      previewRows = await parsePreviewExcel(buffer, 5)
    } else if (fileName.endsWith('.csv')) {
      const text = await file.text()
      previewRows = parsePreviewCSV(text, 5)
    } else {
      return NextResponse.json({ error: 'Formato não suportado. Envie um arquivo .csv ou .xlsx.' }, { status: 400 })
    }

    if (previewRows.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio ou sem dados.' }, { status: 400 })
    }

    // Busca CPFs já cadastrados para verificar duplicatas
    const existingClients = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { cpfHash: true },
    })
    const dbHashes = new Set(existingClients.map((c) => c.cpfHash))

    // Total de linhas no arquivo (primeira leitura para estimativa)
    const fullText = isExcel ? undefined : await file.text()
    const totalLinhas = isExcel
      ? previewRows.length
      : fullText!.split(/\r?\n/).filter(Boolean).length - 1 // menos o cabeçalho

    const rows: PreviewRow[] = []
    let validos = 0
    let duplicatas = 0
    const fileHashes = new Set<string>()

    for (let i = 0; i < previewRows.length; i++) {
      const raw = previewRows[i]
      const linha = i + 1

      const result = CaseImportRowSchema.safeParse(raw)
      if (!result.success) {
        const issues = result.error.issues.map((iss) => iss.message).join('; ')
        rows.push({
          linha,
          cliente_nome: String(raw.clienteNome ?? raw.cliente_nome ?? ''),
          cliente_cpf: String(raw.clienteCpf ?? raw.cliente_cpf ?? ''),
          beneficio: String(raw.beneficio ?? ''),
          status: String(raw.status ?? ''),
          prazo_dias: String(raw.prazoDias ?? raw.prazo_dias ?? ''),
          observacoes: String(raw.observacoes ?? ''),
          valido: false,
          erro: issues,
        })
        continue
      }

      // Valida CPF
      const cpfClean = result.data.clienteCpf.replace(/\D/g, '')
      if (!isValidCPF(cpfClean)) {
        rows.push({
          linha,
          cliente_nome: result.data.clienteNome,
          cliente_cpf: result.data.clienteCpf,
          beneficio: result.data.beneficio,
          status: result.data.status,
          prazo_dias: String(result.data.prazoDias ?? ''),
          observacoes: result.data.observacoes,
          valido: false,
          erro: 'CPF inválido.',
        })
        continue
      }

      let cpfHash: string
      try {
        cpfHash = hashCPF(result.data.clienteCpf)
      } catch {
        rows.push({
          linha,
          cliente_nome: result.data.clienteNome,
          cliente_cpf: result.data.clienteCpf,
          beneficio: result.data.beneficio,
          status: result.data.status,
          prazo_dias: String(result.data.prazoDias ?? ''),
          observacoes: result.data.observacoes,
          valido: false,
          erro: 'Erro ao processar CPF.',
        })
        continue
      }

      if (dbHashes.has(cpfHash)) {
        duplicatas++
        rows.push({
          linha,
          cliente_nome: result.data.clienteNome,
          cliente_cpf: result.data.clienteCpf,
          beneficio: result.data.beneficio,
          status: result.data.status,
          prazo_dias: String(result.data.prazoDias ?? ''),
          observacoes: result.data.observacoes,
          valido: true,
          erro: 'CPF já cadastrado na base.',
        })
        continue
      }

      if (fileHashes.has(cpfHash)) {
        duplicatas++
        rows.push({
          linha,
          cliente_nome: result.data.clienteNome,
          cliente_cpf: result.data.clienteCpf,
          beneficio: result.data.beneficio,
          status: result.data.status,
          prazo_dias: String(result.data.prazoDias ?? ''),
          observacoes: result.data.observacoes,
          valido: true,
          erro: 'CPF duplicado no arquivo.',
        })
        continue
      }

      fileHashes.add(cpfHash)
      validos++
      rows.push({
        linha,
        cliente_nome: result.data.clienteNome,
        cliente_cpf: result.data.clienteCpf,
        beneficio: result.data.beneficio,
        status: result.data.status,
        prazo_dias: String(result.data.prazoDias ?? ''),
        observacoes: result.data.observacoes,
        valido: true,
      })
    }

    return NextResponse.json({
      total: totalLinhas,
      validos,
      duplicatas,
      erros: rows.filter((r) => !r.valido || r.erro),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
