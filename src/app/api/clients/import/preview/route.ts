import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hashCPF } from '@/lib/sanitize-server'
import { isValidCPF } from '@/lib/cpf'
import { handleApiError } from '@/lib/api-error'
import { parseCSVContent, parseExcelContent, parseBirthDate, type ParsedClientRow as ParsedRow } from '@/lib/client-import-parser'

interface PreviewError {
  linha: number
  nome: string
  mensagem: string
  tipo: 'erro' | 'duplicata'
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
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

    let rows: ParsedRow[]

    if (isExcel) {
      const buffer = await file.arrayBuffer()
      rows = await parseExcelContent(buffer)
    } else if (fileName.endsWith('.csv')) {
      const text = await file.text()
      rows = parseCSVContent(text)
    } else {
      return NextResponse.json({ error: 'Formato não suportado. Envie um arquivo .csv ou .xlsx.' }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio ou sem dados.' }, { status: 400 })
    }

    // Busca CPFs já cadastrados para verificar duplicatas no banco
    const existingClients = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { cpfHash: true },
    })
    const dbHashes = new Set(existingClients.map((c) => c.cpfHash))

    const validos: ParsedRow[] = []
    const erros: PreviewError[] = []
    const fileHashes = new Set<string>()
    let duplicatas = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const linha = i + 1

      // Valida campos obrigatórios
      if (!row.nome || !row.cpf || !row.dataNascimento) {
        erros.push({
          linha,
          nome: row.nome || '(sem nome)',
          mensagem: 'Nome, CPF e Data de Nascimento são obrigatórios.',
          tipo: 'erro',
        })
        continue
      }

      // Valida data de nascimento
      if (!parseBirthDate(row.dataNascimento)) {
        erros.push({
          linha,
          nome: row.nome,
          mensagem: `Data de nascimento inválida: ${row.dataNascimento}`,
          tipo: 'erro',
        })
        continue
      }

      // Valida CPF (dígito verificador + hash)
      if (!isValidCPF(row.cpf)) {
        erros.push({
          linha,
          nome: row.nome,
          mensagem: 'CPF inválido.',
          tipo: 'erro',
        })
        continue
      }

      let cpfHash: string
      try {
        cpfHash = hashCPF(row.cpf)
      } catch {
        erros.push({
          linha,
          nome: row.nome,
          mensagem: 'CPF inválido.',
          tipo: 'erro',
        })
        continue
      }

      // Verifica duplicata no banco
      if (dbHashes.has(cpfHash)) {
        duplicatas++
        erros.push({
          linha,
          nome: row.nome,
          mensagem: 'CPF já cadastrado na base.',
          tipo: 'duplicata',
        })
        continue
      }

      // Verifica duplicata no próprio arquivo
      if (fileHashes.has(cpfHash)) {
        duplicatas++
        erros.push({
          linha,
          nome: row.nome,
          mensagem: 'CPF duplicado no arquivo.',
          tipo: 'duplicata',
        })
        continue
      }

      fileHashes.add(cpfHash)
      validos.push(row)
    }

    return NextResponse.json({
      total: rows.length,
      validos: validos.length,
      duplicatas,
      erros,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
