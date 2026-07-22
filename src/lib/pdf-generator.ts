import PDFDocument from 'pdfkit'

type PDFDocType = InstanceType<typeof PDFDocument>

const BRAND = {
  accent: '#d97706',
  dark: '#0f172a',
  light: '#f8fafc',
  slate: '#64748b',
  border: '#e2e8f0',
}

function drawHeader(doc: PDFDocType, title: string): number {
  doc.font('Helvetica-Bold').fontSize(16).fill(BRAND.accent).text('PREVIANDO', 40, 30, {
    continued: true,
  })
  doc.font('Helvetica').fontSize(10).fill(BRAND.dark).text(' — ' + title)

  doc.font('Helvetica').fontSize(7).fill(BRAND.slate).text('app.previando.com.br', 40, 50)

  doc.lineWidth(2).moveTo(40, 58).lineTo(550, 58).stroke(BRAND.accent)

  return 70
}

const FOOTER_Y = 770
const PAGE_MAX_Y = 760
const PAGE_MIN_Y = 60

function drawFooter(doc: PDFDocType, page: number, totalPages: number, userName?: string) {
  doc.lineWidth(0.5).moveTo(40, FOOTER_Y).lineTo(550, FOOTER_Y).stroke(BRAND.border)
  doc.fontSize(7).fill(BRAND.slate)
  doc.text('Gerado por Previando', 40, FOOTER_Y + 5)
  doc.text(`Página ${page} de ${totalPages}`, 400, FOOTER_Y + 5)
  if (userName) {
    doc.font('Helvetica-Bold').fontSize(7).fill(BRAND.dark).text(`Advogado(a): `, 160, FOOTER_Y + 5, { continued: true })
    doc.font('Helvetica').fontSize(7).fill(BRAND.slate).text(userName)
  }
}

function drawSectionHeader(doc: PDFDocType, title: string, y: number) {
  doc.font('Helvetica-Bold').fontSize(11).fill(BRAND.accent).text(title, 40, y)
  doc.lineWidth(0.5).moveTo(40, y + 6).lineTo(550, y + 6).stroke(BRAND.border)
  return y + 14
}

function drawDataRow(doc: PDFDocType, label: string, value: string, y: number) {
  doc.font('Helvetica-Bold').fontSize(9).fill(BRAND.dark).text(label, 40, y, { width: 120 })
  doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(value || '—', 170, y, { width: 340 })
  doc.lineWidth(0.3).moveTo(40, y + 10).lineTo(550, y + 10).stroke(BRAND.border)
  return y + 16
}

function drawClientInfo(doc: PDFDocType, info: ClientInfo, startY: number): number {
  let y = drawSectionHeader(doc, 'Dados do Segurado', startY)
  y = drawDataRow(doc, 'Nome', info.name, y)
  if (info.birthDate) y = drawDataRow(doc, 'Data de Nascimento', info.birthDate, y)
  if (info.phone) y = drawDataRow(doc, 'Telefone', info.phone, y)
  if (info.email) y = drawDataRow(doc, 'Email', info.email, y)
  if (info.maritalStatus) y = drawDataRow(doc, 'Estado Civil', info.maritalStatus, y)
  if (info.profession) y = drawDataRow(doc, 'Profissão', info.profession, y)
  if (info.address) y = drawDataRow(doc, 'Endereço Completo', info.address, y)
  return y + 8
}

function stripMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^\s*[-*]\s+/, '• ')
      .replace(/^\s*\d+[.)]\s+/, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1')
      .replace(/^---+$/gm, '')
      .replace(/\|/g, '')
    )
    .filter((line) => line !== '' || true)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitTextIntoLines(doc: PDFDocType, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = doc.widthOfString(testLine);
      if (width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}


export interface ClientInfo {
  name: string
  birthDate?: string
  phone?: string
  email?: string
  maritalStatus?: string
  profession?: string
  address?: string
}

export interface CasePDFData {
  clientName?: string
  clientCpf?: string
  clientBirthDate?: string
  clientDeathDate?: string
  clientMaritalStatus?: string
  clientSurvivors?: string
  selectedCalculation?: {
    type: string
    value: string
    details: Record<string, string | number>
  }
  opinion?: string
  caseStatus?: string
  createdAt?: string
  watermark?: boolean
}

function collectBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('PDF generation timed out after 30s'))
    }, 30_000)

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => {
      clearTimeout(timeout)
      resolve(Buffer.concat(chunks))
    })
    doc.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

export async function generateCasePDF(data: CasePDFData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 30, left: 40, right: 40 } })
  const pdfPromise = collectBuffer(doc)

  let y = drawHeader(doc, 'Relatório do Caso')

  // Client Data Section
  y = drawSectionHeader(doc, 'Dados do Cliente', y)
  y = drawDataRow(doc, 'Nome', data.clientName || '', y)
  y = drawDataRow(doc, 'CPF', data.clientCpf || '', y)
  y = drawDataRow(doc, 'Data de Nascimento', data.clientBirthDate || '', y)
  if (data.clientDeathDate) {
    y = drawDataRow(doc, 'Data de Óbito', data.clientDeathDate, y)
  }
  y = drawDataRow(doc, 'Estado Civil', data.clientMaritalStatus || '', y)
  if (data.clientSurvivors) {
    y = drawDataRow(doc, 'Dependentes', data.clientSurvivors, y)
  }

  y += 8

  // Case Info Section
  y = drawSectionHeader(doc, 'Informações do Caso', y)
  y = drawDataRow(doc, 'Status', data.caseStatus || '', y)
  y = drawDataRow(doc, 'Data de Criação', data.createdAt || '', y)

  y += 8

  // Calculation Section
  if (data.selectedCalculation) {
    y = drawSectionHeader(doc, 'Cálculo Selecionado', y)
    y = drawDataRow(doc, 'Tipo', data.selectedCalculation.type, y)
    y = drawDataRow(doc, 'Valor', data.selectedCalculation.value, y)
    for (const [key, val] of Object.entries(data.selectedCalculation.details)) {
      y = drawDataRow(doc, key, String(val), y)
    }
  }

  y += 8

  // Opinion Section
  if (data.opinion) {
    y = drawSectionHeader(doc, 'Parecer Jurídico', y)
    renderTextPages(doc, data.opinion, y)
  } else {
    drawFooter(doc, 1, 1)
  }

  // Watermark
  if (data.watermark) {
    doc.fontSize(48).font('Helvetica-Bold').fill('rgba(217, 119, 6, 0.06)').text('PREVIANDO FREE', 100, 180, {
      align: 'center',
    })
  }

  doc.end()

  return pdfPromise
}

interface BpcPDFData {
  result: string
  type: 'BPC' | 'LOAS' | 'BPC/LOAS'
  generatedAt?: string
  clientName?: string
  userName?: string
  clientInfo?: ClientInfo
}

function renderTextPages(doc: PDFDocType, text: string, startY: number, userName?: string) {
  const cleanText = stripMarkdown(text)
  if (!cleanText) return
  const lines = splitTextIntoLines(doc, cleanText, 510)
  let y = startY
  let pageNum = 1

  doc.font('Helvetica').fontSize(9).fill(BRAND.dark)
  for (const line of lines) {
    if (y > PAGE_MAX_Y) {
      drawFooter(doc, pageNum, 0)
      doc.addPage()
      pageNum++
      y = PAGE_MIN_Y
    }
    doc.text(line, 40, y)
    y += 12
  }

  drawFooter(doc, pageNum, pageNum, userName)
}

export interface BpcConsolidatedPDFData {
  sections: { label: string; content: string }[]
  generatedAt?: string
  clientName?: string
  userName?: string
  clientInfo?: ClientInfo
}

function renderTextBlock(doc: PDFDocType, text: string, startY: number, pageState: { y: number; pageNum: number }) {
  const cleanText = stripMarkdown(text)
  if (!cleanText) return
  const lines = splitTextIntoLines(doc, cleanText, 510)
  let y = startY
  doc.font('Helvetica').fontSize(9).fill(BRAND.dark)
  for (const line of lines) {
    if (y > PAGE_MAX_Y) {
      drawFooter(doc, pageState.pageNum, 0)
      doc.addPage()
      pageState.pageNum++
      y = PAGE_MIN_Y
    }
    doc.text(line, 40, y)
    y += 12
  }
  pageState.y = y
}

export async function generateBpcConsolidatedPDF(data: BpcConsolidatedPDFData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 30, left: 40, right: 40 } })
  const pdfPromise = collectBuffer(doc)

  const pageState = { y: drawHeader(doc, 'Relatório BPC/LOAS — Completo'), pageNum: 1 }

  if (data.clientInfo) {
    pageState.y = drawClientInfo(doc, data.clientInfo, pageState.y)
  }

  if (data.generatedAt) {
    doc.font('Helvetica').fontSize(8).fill(BRAND.slate).text(`Gerado em: ${data.generatedAt}`, 40, pageState.y)
    pageState.y += 20
  }

  for (const section of data.sections) {
    if (pageState.y > PAGE_MAX_Y - 40) {
      drawFooter(doc, pageState.pageNum, 0)
      doc.addPage()
      pageState.pageNum++
      pageState.y = PAGE_MIN_Y
    }
    pageState.y = drawSectionHeader(doc, section.label, pageState.y) + 4
    renderTextBlock(doc, section.content, pageState.y, pageState)
    pageState.y += 8
  }

  drawFooter(doc, pageState.pageNum, pageState.pageNum, data.userName)
  doc.end()
  return pdfPromise
}

export async function generateBpcPDF(data: BpcPDFData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 30, left: 40, right: 40 } })
  const pdfPromise = collectBuffer(doc)

  let y = drawHeader(doc, 'Análise BPC/LOAS')

  if (data.clientInfo) {
    y = drawClientInfo(doc, data.clientInfo, y)
  }

  y = drawSectionHeader(doc, 'Tipo de Análise', y)
  doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(data.type, 40, y)
  y += 16

  if (data.generatedAt) {
    y = drawSectionHeader(doc, 'Data de Geração', y)
    doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(data.generatedAt, 40, y)
    y += 16
  }

  y = drawSectionHeader(doc, 'Resultado da Análise', y)
  renderTextPages(doc, data.result, y, data.userName)

  doc.end()
  return pdfPromise
}
