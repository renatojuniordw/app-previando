import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sanitizePhone } from '@/lib/sanitize'
import { hashCPF, sanitizeInput } from '@/lib/sanitize-server'
import { isValidCPF } from '@/lib/cpf'
import { guardClientLimit } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { parseCSVContent, parseExcelContent, parseBirthDate, type ParsedClientRow as ParsedRow } from '@/lib/client-import-parser'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { success } = await rateLimit(`csv-import:${session.user.id}`, 3, 3600)
    if (!success) return NextResponse.json({ error: 'Limite de importações excedido. Tente novamente em 1 hora.' }, { status: 429 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })

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

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Máximo de 500 linhas por importação.' }, { status: 400 })
    }

    // Busca CPFs já cadastrados do usuário para verificar duplicatas no banco
    const existingClients = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { cpfHash: true },
    })
    const dbHashes = new Set(existingClients.map((c) => c.cpfHash))

    const results: { row: number; status: 'created' | 'duplicate' | 'error'; message?: string; nome?: string }[] = []
    let created = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Validação básica dos campos
      if (!row.nome || !row.cpf || !row.dataNascimento) {
        results.push({ row: i + 1, status: 'error', message: 'Nome, CPF e data de nascimento são obrigatórios.', nome: row.nome })
        continue
      }

      const birthDate = parseBirthDate(row.dataNascimento)
      if (!birthDate) {
        results.push({ row: i + 1, status: 'error', message: `Data de nascimento inválida: ${row.dataNascimento}`, nome: row.nome })
        continue
      }

      if (!isValidCPF(row.cpf)) {
        results.push({ row: i + 1, status: 'error', message: 'CPF inválido.', nome: row.nome })
        continue
      }

      let cpfHash: string
      try {
        cpfHash = hashCPF(row.cpf)
      } catch {
        results.push({ row: i + 1, status: 'error', message: 'CPF inválido.', nome: row.nome })
        continue
      }

      // Verifica duplicata no banco
      if (dbHashes.has(cpfHash)) {
        results.push({ row: i + 1, status: 'duplicate', message: 'CPF já cadastrado.', nome: row.nome })
        continue
      }

      // Verifica duplicata no próprio arquivo (já processados nesta importação)
      const alreadyImported = results.some(
        (r) => r.status === 'created' && rows[r.row - 1]?.cpf.replace(/\D/g, '') === row.cpf.replace(/\D/g, '')
      )
      if (alreadyImported) {
        results.push({ row: i + 1, status: 'duplicate', message: 'CPF duplicado no arquivo.', nome: row.nome })
        continue
      }

      // Verifica limite do plano
      try {
        await guardClientLimit(session.user.id, session.user.plan)
      } catch {
        results.push({ row: i + 1, status: 'error', message: 'Limite de clientes do plano atingido.', nome: row.nome })
        break
      }

      const priority = ['CRITICAL', 'ATTENTION', 'NORMAL'].includes((row.prioridade ?? '').toUpperCase())
        ? (row.prioridade.toUpperCase() as 'CRITICAL' | 'ATTENTION' | 'NORMAL')
        : 'NORMAL'

      const createdClient = await prisma.client.create({
        data: {
          userId: session.user.id,
          name: sanitizeInput(row.nome),
          cpfHash,
          birthDate,
          phone: row.telefone ? sanitizePhone(row.telefone) : null,
          email: row.email?.includes('@') ? row.email.trim().toLowerCase() : null,
          priority,
          notes: row.observacoes ? sanitizeInput(row.observacoes) : null,
        },
      })

      dbHashes.add(cpfHash)
      created++
      results.push({ row: i + 1, status: 'created', nome: row.nome })

      // Audit log para cada cliente criado
      await logAudit({
        userId: session.user.id,
        action: 'client.imported',
        resource: createdClient.name,
        metadata: { clientId: createdClient.id, importBatch: true },
      })
    }

    if (created > 0) {
      await prisma.usageRecord.upsert({
        where: { userId: session.user.id },
        update: { totalClients: { increment: created } },
        create: { userId: session.user.id, totalClients: created },
      })
    }

    return NextResponse.json({
      created,
      total: rows.length,
      results,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
