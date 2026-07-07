/**
 * Email Templates for Previando
 *
 * Each template returns a { subject, html } object.
 * All emails are in Portuguese (Brazil) with consistent branding.
 */

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://app.previando.com.br'
const BRAND_COLOR = '#d97706' // amber-600
const BRAND_DARK = '#0f172a'  // slate-900

function wrapper(content: string): string {
  return `
    <div style="font-family:Inter, system-ui, sans-serif; max-width:560px; margin:0 auto; padding:32px 24px; background:#ffffff;">
      <div style="margin-bottom:24px;">
        <span style="font-size:22px; font-weight:700; color:${BRAND_DARK}; letter-spacing:-0.5px;">Previando</span>
      </div>
      ${content}
      <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8;">
        <p>contato@previando.com.br · app.previando.com.br</p>
      </div>
    </div>
  `
}

function button(text: string, url: string): string {
  return `
    <table style="margin:24px 0;" role="presentation">
      <tr>
        <td style="background:${BRAND_COLOR}; border-radius:8px; padding:12px 28px; text-align:center;">
          <a href="${url}" style="color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; display:inline-block;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

export function welcomeEmail(userName: string): { subject: string; html: string } {
  return {
    subject: 'Bem-vindo ao Previando! 🎉',
    html: wrapper(`
      <h2 style="color:${BRAND_DARK}; margin-bottom:8px; font-size:20px;">Bem-vindo ao Previando, ${userName}!</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin-bottom:16px;">
        Sua conta foi criada com sucesso. Agora você pode começar a calcular benefícios previdenciários em minutos.
      </p>
      <h3 style="color:${BRAND_DARK}; font-size:14px; margin-bottom:8px;">Primeiros passos:</h3>
      <ol style="color:#475569; font-size:14px; line-height:1.8; margin-bottom:16px;">
        <li>Cadastre seu primeiro cliente</li>
        <li>Crie um caso para ele</li>
        <li>Faça upload do CNIS para calcular automaticamente</li>
      </ol>
      ${button('Começar agora', `${APP_URL}/dashboard`)}
      <p style="color:#94a3b8; font-size:12px; margin-top:16px;">
        Seu plano atual é <strong>FREE</strong> — aproveite os recursos e faça upgrade quando precisar de mais.
      </p>
    `),
  }
}

export function cnisProcessedEmail(
  clientName: string,
  caseUrl: string,
  totalContributions: number,
  status: 'success' | 'failed'
): { subject: string; html: string } {
  const isSuccess = status === 'success'

  return {
    subject: isSuccess
      ? `CNIS de ${clientName} processado com sucesso`
      : `Falha no processamento do CNIS de ${clientName}`,
    html: wrapper(`
      <h2 style="color:${BRAND_DARK}; margin-bottom:8px; font-size:20px;">
        ${isSuccess ? '✅ CNIS Processado' : '❌ Falha no Processamento'}
      </h2>
      <p style="color:#475569; font-size:14px; line-height:1.6;">
        ${isSuccess
          ? `O CNIS do cliente <strong>${clientName}</strong> foi processado com sucesso.
             Foram encontradas <strong>${totalContributions}</strong> contribuições.`
          : `O CNIS do cliente <strong>${clientName}</strong> não pôde ser processado automaticamente.
             Por favor, tente novamente ou entre em contato com o suporte.`
        }
      </p>
      ${button('Ver detalhes do caso', `${APP_URL}${caseUrl}`)}
    `),
  }
}

export function deadlineReminderEmail(
  clientName: string,
  benefitTypeLabel: string,
  deadlineDate: string,
  daysLeft: number,
  caseUrl: string
): { subject: string; html: string } {
  const isUrgent = daysLeft <= 3

  return {
    subject: isUrgent
      ? `🔴 URGENTE: Prazo de ${benefitTypeLabel} - ${clientName} vence em ${daysLeft} dias`
      : `⏰ Lembrete: Prazo de ${benefitTypeLabel} - ${clientName} vence em ${daysLeft} dias`,
    html: wrapper(`
      <h2 style="color:${BRAND_DARK}; margin-bottom:8px; font-size:20px;">
        ${isUrgent ? '🔴 Prazo Urgente' : '⏰ Lembrete de Prazo'}
      </h2>
      <p style="color:#475569; font-size:14px; line-height:1.6;">
        O prazo do caso de <strong>${benefitTypeLabel}</strong> do cliente
        <strong>${clientName}</strong> vence em <strong>${daysLeft} dias</strong>
        (${deadlineDate}).
      </p>
      ${button('Ver caso', `${APP_URL}${caseUrl}`)}
    `),
  }
}

export function paymentConfirmedEmail(
  planName: string,
  amount: string,
  nextBillingDate: string
): { subject: string; html: string } {
  return {
    subject: `✅ Pagamento confirmado - Plano ${planName} Previando`,
    html: wrapper(`
      <h2 style="color:${BRAND_DARK}; margin-bottom:8px; font-size:20px;">✅ Pagamento Confirmado</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6;">
        Seu pagamento do plano <strong>${planName}</strong> no valor de
        <strong>${amount}</strong> foi confirmado com sucesso.
      </p>
      <p style="color:#475569; font-size:14px;">
        Próxima cobrança: <strong>${nextBillingDate}</strong>
      </p>
      ${button('Acessar Previando', `${APP_URL}/dashboard`)}
    `),
  }
}

export function paymentFailedEmail(
  planName: string,
  billingUrl: string
): { subject: string; html: string } {
  return {
    subject: `❌ Problema no pagamento - Plano ${planName} Previando`,
    html: wrapper(`
      <h2 style="color:${BRAND_DARK}; margin-bottom:8px; font-size:20px;">❌ Pagamento Não Confirmado</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6;">
        Não foi possível processar o pagamento do seu plano <strong>${planName}</strong>.
        Seu plano permanece ativo por enquanto, mas atualize seus dados de pagamento para evitar a suspensão.
      </p>
      ${button('Atualizar pagamento', `${APP_URL}${billingUrl}`)}
    `),
  }
}

export function limitNearEmail(
  resourceName: string,
  usage: number,
  limit: number
): { subject: string; html: string } {
  return {
    subject: `⚠️ Você usou ${usage} de ${limit} ${resourceName} este mês`,
    html: wrapper(`
      <h2 style="color:${BRAND_DARK}; margin-bottom:8px; font-size:20px;">⚠️ Limite Próximo</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6;">
        Você usou <strong>${usage}</strong> de <strong>${limit}</strong> ${resourceName}
        disponíveis no seu plano atual.
      </p>
      <p style="color:#475569; font-size:14px;">
        Faça upgrade para continuar usando sem limites!
      </p>
      ${button('Ver planos', `${APP_URL}/settings/billing`)}
    `),
  }
}
