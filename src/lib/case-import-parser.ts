import ExcelJS from 'exceljs'
import { z } from 'zod'

// CSV: cliente_nome,cliente_cpf,beneficio,status,prazo_dias,observacoes
// Excel (.xlsx): mesmas colunas (primeira linha = cabeçalho)
//
// beneficio: APOSENTADORIA_IDADE | APOSENTADORIA_TEMPO_CONTRIBUICAO | ... (ApiBenefitType)
// status: PROSPECCAO | ANALISE | PRONTO_PARA_REQUERER | EM_PROCESSAMENTO | FINALIZADO (ApiCaseStatus)
// prazo_dias: número inteiro positivo (opcional)

/** Mapa de nomes de colunas possíveis (case-insensitive) para o campo normalizado */
const COLUMN_ALIASES: Record<string, string> = {
  'cliente nome': 'clienteNome',
  'cliente_nome': 'clienteNome',
  'nome do cliente': 'clienteNome',
  nome: 'clienteNome',
  'nome cliente': 'clienteNome',
  clientenome: 'clienteNome',
  'cliente cpf': 'clienteCpf',
  'cliente_cpf': 'clienteCpf',
  cpf: 'clienteCpf',
  cpf_cliente: 'clienteCpf',
  documento: 'clienteCpf',
  beneficio: 'beneficio',
  benefício: 'beneficio',
  'tipo beneficio': 'beneficio',
  'tipo de beneficio': 'beneficio',
  benefit: 'beneficio',
  status: 'status',
  situacao: 'status',
  situação: 'status',
  'prazo dias': 'prazoDias',
  'prazo_dias': 'prazoDias',
  prazo: 'prazoDias',
  prazoemdias: 'prazoDias',
  deadline: 'prazoDias',
  deadlines: 'prazoDias',
  observacoes: 'observacoes',
  observações: 'observacoes',
  notes: 'observacoes',
  observacao: 'observacoes',
  anotacoes: 'observacoes',
}

export const CaseImportRowSchema = z.object({
  clienteNome: z
    .string()
    .min(1, 'Nome do cliente é obrigatório.')
    .max(200, 'Nome do cliente muito longo.'),
  clienteCpf: z
    .string()
    .min(1, 'CPF do cliente é obrigatório.'),
  beneficio: z.enum([
    'APOSENTADORIA_IDADE',
    'APOSENTADORIA_TEMPO_CONTRIBUICAO',
    'APOSENTADORIA_ESPECIAL',
    'APOSENTADORIA_HIBRIDA',
    'APOSENTADORIA_PONTOS',
    'APOSENTADORIA_PCD',
    'AUXILIO_DOENCA',
    'AUXILIO_ACIDENTE',
    'SALARIO_MATERNIDADE',
    'AUXILIO_RECLUSAO',
    'PENSAO_POR_MORTE',
    'BPC_LOAS',
    'REVISAO_BENEFICIO',
  ] as const),
  status: z
    .enum([
      'PROSPECCAO',
      'ANALISE',
      'PRONTO_PARA_REQUERER',
      'EM_PROCESSAMENTO',
      'FINALIZADO',
    ] as const)
    .default('PROSPECCAO'),
  prazoDias: z
    .union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])
    .optional()
    .nullable(),
  observacoes: z.string().max(5000).optional().default(''),
})

export type ParsedCaseRow = z.infer<typeof CaseImportRowSchema>
export type ValidCaseRow = z.infer<typeof CaseImportRowSchema>

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

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, string> = {}

  for (const [rawCol, value] of Object.entries(row)) {
    const col = normalizeColumnName(rawCol)
    if (!col) continue
    mapped[col] = String(value ?? '').trim()
  }

  return mapped
}

export function parseCSVContent(text: string): ValidCaseRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headerCols = parseCsvLine(lines[0])
  const rows: ValidCaseRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const row: Record<string, unknown> = {}
    headerCols.forEach((h, idx) => {
      row[h] = cols[idx] ?? ''
    })
    const normalized = normalizeRow(row)
    const parsed = CaseImportRowSchema.safeParse(normalized)
    if (parsed.success) {
      rows.push(parsed.data)
    }
    // Silently skip rows that don't match — validation errors are
    // handled by the caller (API layer) with per-row reporting
  }

  return rows
}

export async function parseExcelContent(buffer: ArrayBuffer): Promise<ValidCaseRow[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '')
  })

  const rows: ValidCaseRow[] = []
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
      const normalized = normalizeRow(raw)
      const parsed = CaseImportRowSchema.safeParse(normalized)
      if (parsed.success) {
        rows.push(parsed.data)
      }
    }
  })

  return rows
}

/**
 * Parse the first N rows for preview without strict validation
 * (returns raw mapped values before Zod filtering).
 */
export function parsePreviewCSV(text: string, maxRows: number = 5): Record<string, unknown>[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headerCols = parseCsvLine(lines[0])
  const rows: Record<string, unknown>[] = []

  for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
    const cols = parseCsvLine(lines[i])
    const row: Record<string, unknown> = {}
    headerCols.forEach((h, idx) => {
      row[h] = cols[idx] ?? ''
    })
    rows.push(normalizeRow(row))
  }

  return rows
}

export async function parsePreviewExcel(buffer: ArrayBuffer, maxRows: number = 5): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '')
  })

  const rows: Record<string, unknown>[] = []
  let rowCount = 0

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    if (rowCount >= maxRows) return
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
      rowCount++
    }
  })

  return rows
}
