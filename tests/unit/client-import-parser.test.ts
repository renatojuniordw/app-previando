import { describe, it, expect } from 'vitest'
import { parseCSVContent, parseBirthDate, parseExcelContent } from '@/lib/client-import-parser'
import type { ParsedClientRow } from '@/lib/client-import-parser'

describe('parseBirthDate', () => {
  it('parse YYYY-MM-DD', () => {
    const d = parseBirthDate('1990-05-15')
    expect(d).not.toBeNull()
    expect(d?.getUTCFullYear()).toBe(1990)
    expect(d?.getUTCMonth()).toBe(4)
    expect(d?.getUTCDate()).toBe(15)
  })

  it('parse DD/MM/YYYY', () => {
    const d = parseBirthDate('15/05/1990')
    expect(d).not.toBeNull()
    expect(d?.getUTCFullYear()).toBe(1990)
    expect(d?.getUTCMonth()).toBe(4)
    expect(d?.getUTCDate()).toBe(15)
  })

  it('retorna null para formato inválido', () => {
    expect(parseBirthDate('15-05-1990')).toBeNull()
  })

  it('retorna null para string vazia', () => {
    expect(parseBirthDate('')).toBeNull()
  })

  it('retorna null para data inválida', () => {
    expect(parseBirthDate('1990-13-45')).toBeNull()
  })

  it('trim da entrada', () => {
    const d = parseBirthDate('  1990-05-15  ')
    expect(d).not.toBeNull()
  })
})

describe('parseCSVContent', () => {
  it('parse CSV com headers padrão', () => {
    const csv = `nome,cpf,data_nascimento,telefone,email,prioridade,observacoes
João,11144477735,1990-05-15,11999999999,joao@email.com,NORMAL,obs test`
    const rows = parseCSVContent(csv)
    expect(rows.length).toBe(1)
    expect(rows[0].nome).toBe('João')
    expect(rows[0].cpf).toBe('11144477735')
    expect(rows[0].dataNascimento).toBe('1990-05-15')
    expect(rows[0].telefone).toBe('11999999999')
    expect(rows[0].email).toBe('joao@email.com')
    expect(rows[0].prioridade).toBe('NORMAL')
    expect(rows[0].observacoes).toBe('obs test')
  })

  it('parse múltiplas linhas', () => {
    const csv = `nome,cpf
João,11144477735
Maria,22233344455`
    const rows = parseCSVContent(csv)
    expect(rows.length).toBe(2)
    expect(rows[0].nome).toBe('João')
    expect(rows[1].nome).toBe('Maria')
  })

  it('parse com aliases de colunas', () => {
    const csv = `name,cpf,birthdate
João,11144477735,1990-05-15`
    const rows = parseCSVContent(csv)
    expect(rows[0].nome).toBe('João')
    expect(rows[0].cpf).toBe('11144477735')
    expect(rows[0].dataNascimento).toBe('1990-05-15')
  })

  it('retorna vazio para CSV sem dados', () => {
    const csv = `nome,cpf`
    const rows = parseCSVContent(csv)
    expect(rows).toEqual([])
  })

  it('retorna vazio para string vazia', () => {
    expect(parseCSVContent('')).toEqual([])
  })

  it('ignora colunas desconhecidas', () => {
    const csv = `nome,cpf,coluna_inexistente
João,11144477735,valor`
    const rows = parseCSVContent(csv)
    expect(rows[0].nome).toBe('João')
  })

  it('lida com campos vazios', () => {
    const csv = `nome,cpf,data_nascimento
João,,`
    const rows = parseCSVContent(csv)
    expect(rows[0].nome).toBe('João')
    expect(rows[0].cpf).toBe('')
    expect(rows[0].dataNascimento).toBe('')
  })

  it('lida com campos entre aspas', () => {
    const csv = `nome,cpf
"João Silva",11144477735`
    const rows = parseCSVContent(csv)
    expect(rows[0].nome).toBe('João Silva')
  })

  it('DD/MM/YYYY format in CSV', () => {
    const csv = `nome,cpf,data_nascimento
João,11144477735,15/05/1990`
    const rows = parseCSVContent(csv)
    expect(rows[0].dataNascimento).toBe('1990-05-15')
  })
})

describe('parseExcelContent', () => {
  it('parses .xlsx buffer with valid data', async () => {
    const ExcelJS = await import('exceljs')

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Clientes')
    ws.addRow(['nome', 'cpf', 'data_nascimento', 'telefone'])
    ws.addRow(['José', '11144477735', '1990-05-15', '11988887777'])
    ws.addRow(['Maria', '22233344455', '1985-10-20', ''])

    const buffer = await wb.xlsx.writeBuffer() as ArrayBuffer
    const rows = await parseExcelContent(buffer)

    expect(rows).toHaveLength(2)
    expect(rows[0].nome).toBe('José')
    expect(rows[0].cpf).toBe('11144477735')
    expect(rows[0].dataNascimento).toBe('1990-05-15')
    expect(rows[0].telefone).toBe('11988887777')
    expect(rows[1].nome).toBe('Maria')
    expect(rows[1].cpf).toBe('22233344455')
    expect(rows[1].dataNascimento).toBe('1985-10-20')
    expect(rows[1].telefone).toBe('')
  })

  it('returns empty array for empty worksheet', async () => {
    const ExcelJS = await import('exceljs')

    const wb = new ExcelJS.Workbook()
    const buffer = await wb.xlsx.writeBuffer() as ArrayBuffer
    const rows = await parseExcelContent(buffer)

    expect(rows).toEqual([])
  })
})
