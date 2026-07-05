import ExcelJS from 'exceljs'

// Formatos suportados:
// CSV: nome,cpf,data_nascimento,telefone,email,prioridade,observacoes
//   - prioridade: NORMAL|ATTENTION|CRITICAL
//   - data_nascimento: YYYY-MM-DD ou DD/MM/YYYY
// Excel (.xlsx): mesmas colunas (primeira linha = cabeçalho)

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
  data_nascimento: 'dataNascimento',
  telefone: 'telefone',
  phone: 'telefone',
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

export interface ParsedClientRow {
  nome: string
  cpf: string
  dataNascimento: string
  telefone: string
  email: string
  prioridade: string
  observacoes: string
}

function normalizeColumnName(col: string): string | null {
  const key = col.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
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

export function parseBirthDate(raw: string): Date | null {
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

function formatCellDate(raw: unknown): string {
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}-${String(raw.getDate()).padStart(2, '0')}`
  }
  if (typeof raw === 'string') {
    const cleaned = raw.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/')
      return `${year}-${month}-${day}`
    }
  }
  return String(raw ?? '')
}

function normalizeRow(row: Record<string, unknown>): ParsedClientRow {
  const mapped: Record<string, string> = {}
  let dataNascimento = ''

  for (const [rawCol, value] of Object.entries(row)) {
    const col = normalizeColumnName(rawCol)
    if (!col) continue
    if (col === 'dataNascimento') {
      dataNascimento = formatCellDate(value)
    } else {
      mapped[col] = String(value ?? '').trim()
    }
  }

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

export function parseCSVContent(text: string): ParsedClientRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headerCols = parseCsvLine(lines[0])
  const rows: ParsedClientRow[] = []

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

export async function parseExcelContent(buffer: ArrayBuffer): Promise<ParsedClientRow[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '')
  })

  const rows: ParsedClientRow[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // cabeçalho
    const raw: Record<string, unknown> = {}
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber]
      if (!header) return
      raw[header] = cell.value instanceof Object && 'result' in cell.value
        ? (cell.value as { result: unknown }).result
        : cell.value
    })
    if (Object.values(raw).some((v) => v !== null && v !== undefined && v !== '')) {
      rows.push(normalizeRow(raw))
    }
  })

  return rows
}
