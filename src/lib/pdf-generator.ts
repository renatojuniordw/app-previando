import PDFDocument from 'pdfkit'

const BRAND = {
  accent: '#d97706',
  dark: '#0f172a',
  light: '#f8fafc',
  slate: '#64748b',
  border: '#e2e8f0',
}

function drawHeader(doc: PDFDocument, title: string) {
  // Logo text
  doc.font('Helvetica-Bold').fontSize(16).fill(BRAND.accent).text('PREVIANDO', 40, 30, {
    continued: true,
  })
  doc.font('Helvetica').fontSize(10).fill(BRAND.dark).text(' — ' + title)

  // Subtitle
  doc.font('Helvetica').fontSize(7).fill(BRAND.slate).text('app.previando.com.br', 40, 50)

  // Accent line
  doc.stroke(BRAND.accent).lineWidth(2).line(40, 58, 550, 58)
}

function drawFooter(doc: PDFDocument, page: number, totalPages: number) {
  // Border line
  doc.stroke(BRAND.border).lineWidth(0.5).line(40, 260, 550, 260)

  doc.fontSize(7).fill(BRAND.slate)
  doc.text('Gerado por Previando', 40, 265)
  doc.text(`Página ${page} de ${totalPages}`, 400, 265)
}

function drawSectionHeader(doc: PDFDocument, title: string, y: number) {
  doc.font('Helvetica-Bold').fontSize(11).fill(BRAND.accent).text(title, 40, y)
  doc.stroke(BRAND.border).lineWidth(0.5).line(40, y + 6, 550, y + 6)
  return y + 14
}

function drawDataRow(doc: PDFDocument, label: string, value: string, y: number) {
  doc.font('Helvetica-Bold').fontSize(9).fill(BRAND.dark).text(label, 40, y, { width: 120 })
  doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(value || '—', 170, y, { width: 340 })
  doc.stroke(BRAND.border).lineWidth(0.3).line(40, y + 10, 550, y + 10)
  return y + 16
}

function drawTableHeader(doc: PDFDocument, columns: { label: string; width: number }[], y: number) {
  let x = 40
  doc.font('Helvetica-Bold').fontSize(8).fill(BRAND.dark)
  for (const col of columns) {
    doc.text(col.label, x, y, { width: col.width })
    x += col.width
  }
  doc.stroke(BRAND.border).lineWidth(0.5).line(40, y + 10, 550, y + 10)
  return y + 14
}

interface CasePDFData {
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

export async function generateCasePDF(data: CasePDFData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 30, left: 40, right: 40 } })
  const buffers: Buffer[] = []
  doc.pipe(buffers as unknown as NodeJS.WritableStream)

  drawHeader(doc, 'Relatório do Caso')

  let y = 70

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
    doc.font('Helvetica').fontSize(9).fill(BRAND.dark)
    const lines = doc.splitText(data.opinion, 510)
    for (const line of lines) {
      if (y > 240) {
        doc.addPage()
        y = 40
        drawFooter(doc, doc.pages.length, doc.pages.length)
      }
      doc.text(line, 40, y)
      y += 12
    }
  }

  // Watermark
  if (data.watermark) {
    doc.fontSize(48).font('Helvetica-Bold').fill('rgba(217, 119, 6, 0.06)').text('PREVIANDO FREE', 100, 180, {
      align: 'center',
    })
  }

  // Footer
  drawFooter(doc, 1, 1)

  doc.end()

  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
  })
}

interface BpcPDFData {
  result: string
  type: 'BPC' | 'LOAS' | 'BPC/LOAS'
  generatedAt?: string
}

export async function generateBpcPDF(data: BpcPDFData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 20, bottom: 30, left: 40, right: 40 } })
  const buffers: Buffer[] = []
  doc.pipe(buffers as unknown as NodeJS.WritableStream)

  drawHeader(doc, 'Análise BPC/LOAS')

  let y = 70

  y = drawSectionHeader(doc, 'Tipo de Análise', y)
  doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(data.type, 40, y)
  y += 16

  if (data.generatedAt) {
    y = drawSectionHeader(doc, 'Data de Geração', y)
    doc.font('Helvetica').fontSize(9).fill(BRAND.dark).text(data.generatedAt, 40, y)
    y += 16
  }

  y = drawSectionHeader(doc, 'Resultado da Análise', y)
  doc.font('Helvetica').fontSize(9).fill(BRAND.dark)
  const lines = doc.splitText(data.result, 510)
  for (const line of lines) {
    if (y > 240) {
      doc.addPage()
      y = 40
      drawFooter(doc, doc.pages.length, doc.pages.length)
    }
    doc.text(line, 40, y)
    y += 12
  }

  drawFooter(doc, 1, 1)
  doc.end()

  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
  })
}
