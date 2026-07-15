import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import PDFDocument from 'pdfkit'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const access = await prisma.clientAccess.findUnique({
      where: { token: params.token },
      include: {
        case: {
          include: {
            client: { select: { name: true, birthDate: true } },
            user: { select: { name: true, oabNumber: true } },
            calculations: {
              where: { isSelected: true },
              orderBy: { rmi: 'desc' },
            },
            retroactives: { orderBy: { createdAt: 'desc' }, take: 1 },
            bpcAnalysis: true,
          },
        },
      },
    })

    if (!access || access.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Acesso não encontrado ou expirado.' }, { status: 404 })
    }

    const c = access.case

    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Header
    doc.font('Helvetica-Bold').fontSize(16).fill('#d97706').text('PREVIANDO', 40, 30, { continued: true })
    doc.font('Helvetica').fontSize(10).fill('#0f172a').text(' — Relatório do Cliente')
    doc.font('Helvetica').fontSize(7).fill('#64748b').text('app.previando.com.br', 40, 50)
    doc.lineWidth(2).moveTo(40, 58).lineTo(550, 58).stroke('#d97706')

    let y = 80

    // Client info
    doc.font('Helvetica-Bold').fontSize(12).fill('#0f172a').text('Dados do Cliente', 40, y)
    y += 20
    doc.font('Helvetica').fontSize(10).fill('#334155')
    doc.text(`Nome: ${c.client.name}`, 40, y)
    y += 15
    doc.text(`Data de Nascimento: ${new Date(c.client.birthDate).toLocaleDateString('pt-BR')}`, 40, y)
    y += 15
    doc.text(`Tipo de Benefício: ${c.benefitType.replace(/_/g, ' ')}`, 40, y)
    y += 15
    doc.text(`Advogado: ${c.user.name}${c.user.oabNumber ? ` (OAB ${c.user.oabNumber})` : ''}`, 40, y)
    y += 25

    // Calculations
    if (c.calculations.length > 0) {
      doc.moveTo(40, y).lineTo(550, y).stroke('#e2e8f0')
      y += 15
      doc.font('Helvetica-Bold').fontSize(12).fill('#0f172a').text('Cálculos do Benefício', 40, y)
      y += 20

      for (const calc of c.calculations) {
        const rmi = Number(calc.rmi)
        const rma = Number(calc.rma)

        doc.font('Helvetica-Bold').fontSize(10).fill('#0f172a')
        doc.text(`${calc.eligible ? '✅' : '❌'} ${calc.modality}`, 40, y)
        y += 15

        doc.font('Helvetica').fontSize(9).fill('#475569')
        doc.text(`RMI: R$ ${rmi.toFixed(2)}`, 55, y)
        y += 13
        doc.text(`RMA: R$ ${rma.toFixed(2)}`, 55, y)
        y += 13
        if (calc.expectedDib) {
          doc.text(`DIB Estimada: ${new Date(calc.expectedDib).toLocaleDateString('pt-BR')}`, 55, y)
          y += 13
        }
        if (calc.contributionTime != null) {
          doc.text(`Tempo de Contribuição: ${calc.contributionTime} meses`, 55, y)
          y += 13
        }
        y += 10
      }
    }

    // Retroactives
    if (c.retroactives.length > 0) {
      doc.moveTo(40, y).lineTo(550, y).stroke('#e2e8f0')
      y += 15
      doc.font('Helvetica-Bold').fontSize(12).fill('#0f172a').text('Valores Retroativos', 40, y)
      y += 20

      for (const retro of c.retroactives) {
        doc.font('Helvetica').fontSize(9).fill('#475569')
        doc.text(`Competência Inicial: ${new Date(retro.entitlementStartDate).toLocaleDateString('pt-BR')}`, 55, y)
        y += 13
        doc.text(`Meses de Atraso: ${retro.monthsLate}`, 55, y)
        y += 13
        doc.text(`Total Bruto: R$ ${Number(retro.totalGrossValue).toFixed(2)}`, 55, y)
        y += 13
        doc.text(`Total Corrigido (${retro.correctionIndex}): R$ ${Number(retro.totalCorrectedValue).toFixed(2)}`, 55, y)
        y += 13
        doc.font('Helvetica-Bold').fill('#16a34a')
        doc.text(`Valor Líquido Final: R$ ${Number(retro.finalNetValue).toFixed(2)}`, 55, y)
        y += 13
        doc.font('Helvetica').fill('#475569')
        y += 10
      }
    }

    // BPC
    if (c.bpcAnalysis) {
      const bpc = c.bpcAnalysis
      doc.moveTo(40, y).lineTo(550, y).stroke('#e2e8f0')
      y += 15
      doc.font('Helvetica-Bold').fontSize(12).fill('#0f172a').text('Análise Socioeconômica (BPC/LOAS)', 40, y)
      y += 20

      doc.font('Helvetica').fontSize(9).fill('#475569')
      doc.text(`Modalidade: ${bpc.tipoBpc === 'IDOSO' ? 'BPC Idoso' : 'BPC Pessoa com Deficiência'}`, 55, y)
      y += 13
      doc.text(`Idade: ${bpc.idade} anos`, 55, y)
      y += 13
      doc.text(`Renda Familiar: R$ ${Number(bpc.rendaFamiliar).toFixed(2)}`, 55, y)
      y += 13
      doc.text(`Renda Per Capita: R$ ${Number(bpc.rendaPerCapita).toFixed(2)}`, 55, y)
      y += 13
      doc.text(`Membros do Grupo: ${bpc.membrosGrupo}`, 55, y)
      y += 13
    }

    // Footer
    doc.font('Helvetica').fontSize(7).fill('#94a3b8')
    doc.text('Este documento é de uso exclusivo do cliente e seu advogado.', 40, 750)
    doc.text(`Gerado pelo Previando em ${new Date().toLocaleString('pt-BR')}`, 40, 762)

    doc.end()

    const buffer = await pdfPromise

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-${c.client.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
