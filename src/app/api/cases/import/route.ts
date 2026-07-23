import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hashCPF, sanitizeInput } from '@/lib/sanitize-server'
import { isValidCPF } from '@/lib/cpf'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { mapBenefitTypeToDb, mapCaseStatusToDb } from '@/lib/mappers'
import {
  parseCSVContent,
  parseExcelContent,
  CaseImportRowSchema,
  type ValidCaseRow,
} from '@/lib/case-import-parser'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica plano
    await guardFeature(session.user.plan, 'VIABILITY_SCORE')

    const { success } = await rateLimit(`case-import:${session.user.id}`, 3, 3600)
    if (!success) {
      return NextResponse.json({ error: 'Limite de importações excedido. Tente novamente em 1 hora.' }, { status: 429 })
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

    let rows: ValidCaseRow[]

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
      return NextResponse.json({ error: 'Arquivo vazio ou sem dados válidos.' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Máximo de 500 linhas por importação.' }, { status: 400 })
    }

    // Busca clientes existentes do usuário (por cpfHash) para reutilizar
    const existingClients = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { id: true, cpfHash: true, name: true },
    })
    const clientByHash = new Map(existingClients.map((c) => [c.cpfHash, c as { id: string; cpfHash: string; name: string }]))

    const errors: Array<{ row: number; error: string }> = []
    let imported = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 1

      // Valida CPF
      if (!isValidCPF(row.clienteCpf)) {
        errors.push({ row: rowNumber, error: `CPF inválido: ${row.clienteCpf}` })
        continue
      }

      let cpfHash: string
      try {
        cpfHash = hashCPF(row.clienteCpf)
      } catch {
        errors.push({ row: rowNumber, error: 'Erro ao processar CPF.' })
        continue
      }

      // Busca ou cria o cliente por CPF
      let client = clientByHash.get(cpfHash) as
        | { id: string; cpfHash: string; name: string }
        | undefined

      if (!client) {
        // Cria o cliente automaticamente com os dados disponíveis
        try {
          const created = await prisma.client.create({
            data: {
              userId: session.user.id,
              name: sanitizeInput(row.clienteNome),
              cpfHash,
              birthDate: new Date('1900-01-01'), // data mínima — será preenchida depois
              priority: 'NORMAL',
            },
          })
          client = created as { id: string; cpfHash: string; name: string }
          clientByHash.set(cpfHash, created)
        } catch {
          errors.push({ row: rowNumber, error: 'Erro ao criar cliente. Verifique se o CPF já existe.' })
          continue
        }
      }

      // Garantia de tipo após o bloco
      if (!client) {
        errors.push({ row: rowNumber, error: 'Erro ao obter cliente.' })
        continue
      }

      // Valida Zod novamente (redundante, mas seguro)
      const parsed = CaseImportRowSchema.safeParse(row)
      if (!parsed.success) {
        const issues = parsed.error.issues.map((iss) => iss.message).join('; ')
        errors.push({ row: rowNumber, error: `Dados inválidos: ${issues}` })
        continue
      }

      // Cria o caso
      try {
        const deadlineDays = parsed.data.prazoDias ?? null
        const deadlineDate = deadlineDays
          ? new Date(Date.now() + deadlineDays * 86400000)
          : null

        await prisma.case.create({
          data: {
            userId: session.user.id,
            clientId: client.id,
            benefitType: mapBenefitTypeToDb(parsed.data.beneficio),
            status: mapCaseStatusToDb(parsed.data.status),
            deadlineDays,
            deadlineDate,
            notes: parsed.data.observacoes
              ? sanitizeInput(parsed.data.observacoes)
              : null,
          },
        })

        imported++
      } catch {
        errors.push({ row: rowNumber, error: 'Erro ao criar caso no banco de dados.' })
        continue
      }
    }

    // Audit log para importação em lote
    if (imported > 0) {
      await logAudit({
        userId: session.user.id,
        action: 'case.imported',
        resource: `Importação em massa — ${imported} casos`,
        metadata: { imported, totalRows: rows.length, errors: errors.length },
      })
    }

    return NextResponse.json({
      imported,
      errors,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
