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

function isMarkdownHeading(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,3})\s+(.+)$/)
  if (match) return { level: match[1].length, text: match[2] }
  return null
}

function renderFormattedMarkdown(doc: PDFDocType, text: string, startY: number, userName?: string) {
  const rawLines = text.split('\n')
  let y = startY
  let pageNum = 1
  const maxWidth = 510

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]
    const trimmed = line.trim()

    if (y > PAGE_MAX_Y) {
      drawFooter(doc, pageNum, 0)
      doc.addPage()
      pageNum++
      y = PAGE_MIN_Y
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed)) {
      y += 4
      doc.lineWidth(0.5).moveTo(40, y).lineTo(550, y).stroke(BRAND.border)
      y += 8
      continue
    }

    // Empty line = paragraph break
    if (trimmed === '') {
      y += 6
      continue
    }

    // Markdown heading
    const heading = isMarkdownHeading(trimmed)
    if (heading) {
      y += 4
      if (heading.level === 1) {
        doc.font('Helvetica-Bold').fontSize(14).fill(BRAND.dark).text(heading.text, 40, y, { width: maxWidth })
        y += 20
      } else if (heading.level === 2) {
        doc.font('Helvetica-Bold').fontSize(11).fill(BRAND.accent).text(heading.text, 40, y, { width: maxWidth })
        doc.lineWidth(0.5).moveTo(40, y + 14).lineTo(550, y + 14).stroke(BRAND.border)
        y += 20
      } else {
        doc.font('Helvetica-Bold').fontSize(10).fill(BRAND.dark).text(heading.text, 40, y, { width: maxWidth })
        y += 16
      }
      continue
    }

    // Bullet list item
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      const bulletText = trimmed.replace(/^[•-]\s*/, '')
      doc.font('Helvetica').fontSize(9).fill(BRAND.dark)
      const bulletX = 50
      doc.text('•', 40, y, { width: 8 })
      doc.text(bulletText, bulletX, y, { width: maxWidth - 10 })
      const height = doc.heightOfString(bulletText, { width: maxWidth - 10 })
      y += Math.max(height + 2, 14)
      continue
    }

    // Bold/italic text (inline)
    const cleanLine = trimmed
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1')

    // Regular text with possible bold prefix (like "RMI: R$ 4.898,95")
    doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(cleanLine, 40, y, { width: maxWidth })
    y += 14
  }

  drawFooter(doc, pageNum, pageNum, userName)
}


function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `XXX.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
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
  clientProfession?: string
  clientPhone?: string
  clientEmail?: string
  clientAddress?: string
  selectedCalculation?: {
    type: string
    value: string
    details: Record<string, string | number>
    formulaSummary?: string
    averageSalary?: string
    coefficient?: string
  }
  opinion?: string
  caseStatus?: string
  createdAt?: string
  cnisSummary?: string
  lawyerName?: string
  lawyerOab?: string
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
  y = drawDataRow(doc, 'CPF', maskCPF(data.clientCpf || ''), y)
  y = drawDataRow(doc, 'Data de Nascimento', data.clientBirthDate || '', y)
  if (data.clientDeathDate) y = drawDataRow(doc, 'Data de Óbito', data.clientDeathDate, y)
  y = drawDataRow(doc, 'Estado Civil', data.clientMaritalStatus || '', y)
  if (data.clientProfession) y = drawDataRow(doc, 'Profissão', data.clientProfession, y)
  if (data.clientPhone) y = drawDataRow(doc, 'Telefone', data.clientPhone, y)
  if (data.clientEmail) y = drawDataRow(doc, 'Email', data.clientEmail, y)
  if (data.clientAddress) y = drawDataRow(doc, 'Endereço', data.clientAddress, y)

  y += 8

  // CNIS Summary
  if (data.cnisSummary) {
    y = drawSectionHeader(doc, 'Resumo do CNIS', y)
    doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(data.cnisSummary, 40, y, { width: 510 })
    y += 20
  }

  // Case Info Section
  y = drawSectionHeader(doc, 'Informações do Caso', y)
  y = drawDataRow(doc, 'Status', data.caseStatus || '', y)
  y = drawDataRow(doc, 'Data de Criação', data.createdAt || '', y)

  y += 8

  // Calculation Section
  if (data.selectedCalculation) {
    y = drawSectionHeader(doc, 'Cálculo Selecionado', y)
    y = drawDataRow(doc, 'Tipo', data.selectedCalculation.type, y)
    y = drawDataRow(doc, 'Valor (RMI)', data.selectedCalculation.value, y)
    if (data.selectedCalculation.averageSalary) {
      y = drawDataRow(doc, 'Média Salarial', data.selectedCalculation.averageSalary, y)
    }
    if (data.selectedCalculation.coefficient) {
      y = drawDataRow(doc, 'Coeficiente', data.selectedCalculation.coefficient, y)
    }
    for (const [key, val] of Object.entries(data.selectedCalculation.details)) {
      y = drawDataRow(doc, key, String(val), y)
    }
    if (data.selectedCalculation.formulaSummary) {
      y += 4
      doc.font('Helvetica-Oblique').fontSize(8).fill(BRAND.slate)
        .text(data.selectedCalculation.formulaSummary, 40, y, { width: 510 })
      y += 16
    }
  }

  y += 8

  // Opinion Section
  if (data.opinion) {
    y = drawSectionHeader(doc, 'Parecer Jurídico', y)
    renderFormattedMarkdown(doc, data.opinion, y, data.lawyerName)
  } else {
    drawFooter(doc, 1, 1, data.lawyerName)
  }

  // AI Disclaimer
  if (data.opinion || data.selectedCalculation) {
    doc.addPage()
    let dy = 40
    dy = drawSectionHeader(doc, 'Informações Importantes', dy)
    doc.font('Helvetica').fontSize(8).fill(BRAND.dark).text(
      'Este documento foi gerado automaticamente pela plataforma Previando com auxílio de inteligência artificial. ' +
      'Os cálculos e análises apresentados são baseados nos dados fornecidos e nas regras vigentes. ' +
      'Recomenda-se revisão por um profissional habilitado antes da utilização para fins legais.',
      40, dy + 4, { width: 510, align: 'justify' }
    )
  }

  // Watermark
  if (data.watermark) {
    for (let i = 0; i < doc.bufferedPageRange().count; i++) {
      doc.switchToPage(i)
      doc.fontSize(48).font('Helvetica-Bold').fillOpacity(0.06).fill(BRAND.accent)
        .text('PREVIANDO FREE', 100, 300, { align: 'center' })
      doc.fillOpacity(1)
    }
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

export interface BpcConsolidatedPDFData {
  sections: { label: string; content: string }[]
  generatedAt?: string
  clientName?: string
  userName?: string
  clientInfo?: ClientInfo
}

function renderTextBlock(doc: PDFDocType, text: string, startY: number, pageState: { y: number; pageNum: number }) {
  const rawLines = text.split('\n')
  let y = startY
  const maxWidth = 510

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim()

    if (y > PAGE_MAX_Y) {
      drawFooter(doc, pageState.pageNum, 0)
      doc.addPage()
      pageState.pageNum++
      y = PAGE_MIN_Y
    }

    if (trimmed === '') {
      y += 4
      continue
    }

    const heading = isMarkdownHeading(trimmed)
    if (heading) {
      y += 2
      if (heading.level <= 2) {
        doc.font('Helvetica-Bold').fontSize(11).fill(BRAND.accent)
        doc.text(heading.text, 40, y, { width: maxWidth })
        y += 16
      } else {
        doc.font('Helvetica-Bold').fontSize(9).fill(BRAND.dark)
        doc.text(heading.text, 40, y, { width: maxWidth })
        y += 14
      }
      continue
    }

    const cleanText = trimmed
      .replace(/^\s*[-*]\s+/, '• ')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1')

    doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(cleanText, 40, y, { width: maxWidth })
    y += 14
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
  renderFormattedMarkdown(doc, data.result, y, data.userName)

  doc.end()
  return pdfPromise
}
