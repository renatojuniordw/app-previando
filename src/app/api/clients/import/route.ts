import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hashCPF, sanitizeInput, sanitizePhone } from '@/lib/sanitize'
import { guardClientLimit } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import * as XLSX from 'xlsx'

// Formatos suportados:
// CSV: nome,cpf,data_nascimento,telefone,email,prioridade,observacoes
//   - prioridade: NORMAL|ATTENTION|CRITICAL
//   - data_nascimento: YYYY-MM-DD ou DD/MM/YYYY
// Excel (.xlsx): mesmas colunas (primeira linha = cabeçalho)
// Colunas esperadas: Nome, CPF, Data Nascimento, Telefone, Email, Prioridade, Observações

/** Mapa de nomes de colunas possíveis (case-insensitive) para o campo normalizado */
const COLUMN_ALIASES: Record<string, string> = {
  nome: 'nome',
  name: 'nome',
  'nome completo': 'nome',
  cpf: 'cpf',
  documento: 'cpf',
  'data nascimento': 'dataNascimento',
  'data de nascimento': 'dataNascimento',
  nascimento: 'dataNascimento',
  birthdate: 'dataNascimento',
  'data_nascimento': 'dataNascimento',
  telefone: 'telefone',
  phone: 'telefone',
  whatsapp: 'telefone',
  celular: 'telefone',
  email: 'email',
  e_mail: 'email',
  prioridade: 'prioridade',
  priority: 'prioridade',
  observacoes: 'observacoes',
  observações: 'observacoes',
  notes: 'observacoes',
  observacao: 'observacoes',
  anotacoes: 'observacoes',
}

interface ParsedRow {
  nome: string
  cpf: string
  dataNascimento: string
  telefone: string
  email: string
  prioridade: string
  observacoes: string
}

function normalizeColumnName(col: string): string | null {
  const key = col.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return COLUMN_ALIASES[key] ?? null
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseBirthDate(raw: string): Date | null {
  const cleaned = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const d = new Date(cleaned + 'T00:00:00Z')
    return isNaN(d.getTime()) ? null : d
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
    const [day, month, year] = cleaned.split('/')
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function parseExcelDate(raw: unknown): string {
  if (typeof raw === 'number') {
    // Excel serial date number
    const d = XLSX.SSF.parse_date_code(raw)
    if (d) {
      return `${String(d.y).padStart(4, '0')}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
    }
  }
  if (typeof raw === 'string') {
    const cleaned = raw.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/')
      return `${year}-${month}-${day}`
    }
  }
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}-${String(raw.getDate()).padStart(2, '0')}`
  }
  return String(raw ?? '')
}

function normalizeRow(row: Record<string, unknown>): ParsedRow {
  const mapped: Record<string, string> = {}
  for (const [rawCol, value] of Object.entries(row)) {
    const col = normalizeColumnName(rawCol)
    if (col) {
      mapped[col] = String(value ?? '').trim()
    }
  }

  // Se a data veio do Excel como número serial, converte
  const rawDate = row[Object.keys(row).find((k) => normalizeColumnName(k) === 'dataNascimento') ?? '']
  const dataNascimento = rawDate !== undefined ? parseExcelDate(rawDate) : (mapped['dataNascimento'] ?? '')

  return {
    nome: mapped['nome'] ?? '',
    cpf: mapped['cpf'] ?? '',
    dataNascimento,
    telefone: mapped['telefone'] ?? '',
    email: mapped['email'] ?? '',
    prioridade: mapped['prioridade'] ?? '',
    observacoes: mapped['observacoes'] ?? '',
  }
}

function parseCSVContent(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headerCols = parseCsvLine(lines[0])
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const row: Record<string, unknown> = {}
    headerCols.forEach((h, idx) => {
      row[h] = cols[idx] ?? ''
    })
    rows.push(normalizeRow(row))
  }

  return rows
}

function parseExcelContent(buffer: ArrayBuffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []

  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return jsonData.map((row) => normalizeRow(row))
}

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
      rows = parseExcelContent(buffer)
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
