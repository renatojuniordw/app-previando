import { NextRequest, NextResponse } from 'next/server'
import { authWithFreshPlan as auth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { guardFeature } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { formatCurrency, formatDate } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'

// Gera um PDF simples em HTML + CSS para o caso
// Em produção considerar puppeteer ou react-pdf
export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const limit = await rateLimit(`sensitive:${session.user.id}`, 30, 60)
    if (!limit.success) return NextResponse.json({ error: 'Limite de operações atingido.' }, { status: 429 })

    // Planos FREE têm marca d'água, não bloqueiam o PDF
    const planLimit = await prisma.planLimit.findUnique({
      where: { plan: session.user.plan as never },
    })
    const watermark = planLimit?.watermarkEnabled ?? true

    // SOLO+ requer feature exportPdfEnabled para PDF limpo
    if (!watermark) {
      await guardFeature(session.user.plan, 'EXPORT_PDF')
    }

    await verifyCaseOwnership(params.caseId, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.caseId },
      include: {
        client: { select: { name: true } },
        calculations: { where: { isSelected: true }, take: 1 },
        opinions: { where: { status: 'FINALIZED' }, take: 1 },
      },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    const selectedCalc = caso.calculations[0]
    const finalOpinion = caso.opinions[0]

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
  h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; }
  h2 { font-size: 14px; margin-top: 24px; text-transform: uppercase; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { padding: 6px 8px; border: 1px solid #ccc; font-size: 12px; }
  td:first-child { font-weight: bold; background: #f5f5f5; width: 200px; }
  .watermark { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 80px; color: rgba(0,0,0,0.07); font-weight: bold; pointer-events: none; }
  .footer { margin-top: 40px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
  .opinion { margin-top: 8px; font-size: 12px; line-height: 1.6; white-space: pre-wrap; }
</style>
</head>
<body>
${watermark ? '<div class="watermark">PREVIANDO FREE</div>' : ''}
<h1>Previando — Relatório do Caso</h1>

<h2>Dados do Cliente</h2>
<table>
  <tr><td>Nome</td><td>${caso.client?.name ?? '-'}</td></tr>
  <tr><td>Tipo de Benefício</td><td>${caso.benefitType.replace(/_/g, ' ')}</td></tr>
  <tr><td>Status</td><td>${caso.status.replace(/_/g, ' ')}</td></tr>
  <tr><td>Prioridade</td><td>${caso.priority}</td></tr>
</table>

${selectedCalc ? `
<h2>Cálculo Selecionado</h2>
<table>
  <tr><td>Modalidade</td><td>${selectedCalc.modality.replace(/_/g, ' ')}</td></tr>
  <tr><td>RMI</td><td>${formatCurrency(selectedCalc.rmi.toString())}</td></tr>
  <tr><td>RMA</td><td>${formatCurrency(selectedCalc.rma.toString())}</td></tr>
  <tr><td>Elegível</td><td>${selectedCalc.eligible ? 'Sim' : 'Não'}</td></tr>
  ${selectedCalc.expectedDib ? `<tr><td>DIB Prevista</td><td>${formatDate(selectedCalc.expectedDib)}</td></tr>` : ''}
</table>
` : ''}

${finalOpinion ? `
<h2>Parecer Jurídico Preliminar</h2>
<div class="opinion">${(finalOpinion.customizedContent ?? finalOpinion.generatedContent).slice(0, 10000)}</div>
` : ''}

<div class="footer">
  Gerado em ${formatDate(new Date())} · Previando (app.previando.com.br) · Previando é um produto Unificando
  ${watermark ? '· Este documento é uma versão gratuita com marca d\'água. Faça upgrade para o Plano Solo.' : ''}
</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="previando-caso-${params.caseId}.html"`,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
