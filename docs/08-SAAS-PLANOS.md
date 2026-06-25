# 08 — SAAS: PLANOS E PAGAMENTOS
> Freemium, Mercado Pago Subscriptions, Webhooks e WhatsApp Share

---

## Planos

| | FREE | SOLO R$299/mês | PRO R$599/mês |
|---|---|---|---|
| Clientes | 3 total | 30 total | Ilimitado |
| Cálculos/mês | 5 | Ilimitado | Ilimitado |
| Pareceres IA/mês | 1 | 20 | Ilimitado |
| Simulador | ❌ | ✅ | ✅ |
| Retroativos | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ✅ | ✅ |
| WhatsApp share | ❌ | ✅ | ✅ |
| Marca d'água | ✅ | ❌ | ❌ |

---

## Fluxo de Upgrade

```
[POST /api/billing/subscribe] → cria subscription no MP
    → MP retorna init_point (URL de pagamento)
    → frontend redireciona usuário para URL do MP
    → usuário paga
    → MP dispara webhook → POST /api/webhooks/mercadopago
    → webhook atualiza user.plan + user.planStatus no banco
    → MP redireciona para app.previando.com.br/settings/billing?status=success
```

---

## Mercado Pago

```typescript
// lib/mercadopago.ts
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
export const mpPreApproval = new PreApproval(mp)

export const MP_PLAN_IDS = {
  SOLO: process.env.MP_PLAN_ID_SOLO!,
  PRO:  process.env.MP_PLAN_ID_PRO!,
}
```

---

## API: Criar Assinatura

```typescript
// POST /api/billing/subscribe
// body: { plan: 'SOLO' | 'PRO' }

const subscription = await mpPreApproval.create({
  body: {
    preapproval_plan_id: MP_PLAN_IDS[plan],
    payer_email: user.email,
    back_url: 'https://app.previando.com.br/settings/billing?status=success',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: plan === 'SOLO' ? 299 : 599,
      currency_id: 'BRL',
    },
  }
})

return { initPoint: subscription.init_point }
```

---

## Webhook Mercado Pago

```typescript
// POST /api/webhooks/mercadopago

// 1. Verificar assinatura criptográfica do webhook
// 2. Processar evento por tipo:
//    - subscription_preapproval → atualizar plan + planStatus (em prisma.$transaction)
//    - payment → registrar em payments (evitar duplicatas)
// 3. Invalidar cache de plano após mudança: invalidatePlanLimitCache(plan)

function verifyMPSignature(body: string, signature: string, requestId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET!
  const manifest = `id:${requestId};request-body:${body};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  const received = signature.split(',').find(p => p.startsWith('v1='))?.replace('v1=', '') ?? ''
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}

// Mapeamento COMPLETO de status MP → PaymentStatus enum (prisma)
// Inclui todos os valores que o MP pode enviar
function mapMpPaymentStatus(mpStatus: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    approved:       'APPROVED',
    pending:        'PENDING',
    in_process:     'PENDING',
    rejected:       'FAILED',
    cancelled:      'CANCELLED',
    refunded:       'REFUNDED',
    charged_back:   'REFUNDED',   // chargeback → trata como refund
    in_mediation:   'PENDING',
    authorized:     'APPROVED',
  }
  return map[mpStatus] ?? 'PENDING'
}
```

---

## Notificações de Limite Próximo (PLAN_LIMIT_NEAR)

Quando o uso mensal atinge **80% do limite**, uma notificação `PLAN_LIMIT_NEAR` é criada automaticamente no banco. Deduplicação via Redis — máximo 1 notificação por usuário por dia.

```typescript
// src/lib/plan-guard.ts
const NEAR_LIMIT_THRESHOLD = 0.8

// Acionado em guardCalculationLimit e guardOpinionLimit
if (currentCount / limit.maxXPerMonth >= NEAR_LIMIT_THRESHOLD) {
  notifyLimitNear(userId, `Você usou ${currentCount} de ${limit.maxXPerMonth} ...`)
}
```

A notificação aparece no bell do Header com a label "Limite próximo".

---

## Reset Mensal de Uso

O reset dos contadores mensais (`calculationsThisMonth`, `opinionsThisMonth`, etc.) é feito **inline** na verificação de limite, não via cron job.

```typescript
// src/lib/plan-guard.ts

async function getOrResetUsageRecord(userId: string): Promise<UsageRecord | null> {
  const record = await prisma.usageRecord.findUnique({ where: { userId } })
  if (!record) return null
  const now = new Date()
  // Compara ano+mês — se mudou, zera todos os contadores
  if (!isSameMonth(now, new Date(record.usageMonthRef))) {
    return prisma.usageRecord.update({
      where: { userId },
      data: {
        calculationsThisMonth: 0,
        opinionsThisMonth: 0,
        bpcAnalysesThisMonth: 0,
        bpcSocialMediaThisMonth: 0,
        usageMonthRef: now,
      },
    })
  }
  return record
}
```

> **Invariante:** `usageMonthRef` no banco sempre representa o mês de referência atual dos contadores. Nunca usar `findUnique` direto no `UsageRecord` sem passar por `getOrResetUsageRecord`.

---

## API: Uso Atual

```typescript
// GET /api/usage — retorna para o frontend montar a UsageBar

{
  plan: 'FREE',
  planStatus: 'ACTIVE',
  usage: {
    totalClients: 2,
    calculationsThisMonth: 3,
    opinionsThisMonth: 0,
  },
  limits: {
    maxClients: 3,
    maxCalculationsPerMonth: 5,
    maxOpinionsPerMonth: 1,
    simulatorEnabled: false,
    retroativosEnabled: false,
    exportPdfEnabled: false,
    whatsappEnabled: false,
    watermarkEnabled: true,
  }
}
```

---

## WhatsApp Share

```typescript
// GET /api/export/whatsapp/:caseId

// 1. Verifica plano (WHATSAPP_SHARE)
// 2. Busca caso + cliente (phone obrigatório) + cálculo selecionado
// 3. Monta mensagem de texto puro com buildWhatsAppMessage()
// 4. Retorna { phone, message, whatsappUrl }

// Frontend abre: window.open(whatsappUrl, '_blank')
// → Abre WhatsApp Web/App com número e mensagem pré-preenchidos

// Mensagem inclui rodapé:
// "Calculado via Previando (app.previando.com.br)"
```

---

## Variáveis de Ambiente

```env
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""
MP_PLAN_ID_SOLO=""
MP_PLAN_ID_PRO=""
```

---

## Avisos de Uso no Frontend

```
80% do limite:
⚠️ "Você usou 4 de 5 cálculos este mês. Faça upgrade para ilimitado."

100% do limite:
🔴 "Limite atingido. Seu plano FREE inclui 5 cálculos/mês." [Fazer upgrade]

Feature bloqueada:
🔒 Botão com tooltip + clique abre modal de upgrade
```

---

## Verificação de Assinatura do Webhook

O webhook do Mercado Pago valida a assinatura HMAC-SHA256 usando `x-signature`, `x-request-id` e `data.id` no formato oficial do MP. Rejeita com 401 se inválida.

```typescript
const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
const expected = createHmac('sha256', secret).update(manifest).digest('hex')
return expected === v1  // v1 extraído do header x-signature
```

> Configurar `MERCADOPAGO_WEBHOOK_SECRET` igual ao valor definido no painel do MP. Sem este secret, TODOS os webhooks são rejeitados.

---

## Checklist de Pagamentos (pré-deploy)

- [ ] Planos criados no painel Mercado Pago (SOLO R$299 e PRO R$599)
- [ ] IDs dos planos configurados nas env vars
- [ ] Webhook configurado no MP: `https://app.previando.com.br/api/webhooks/mercadopago`
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` igual ao configurado no MP
- [ ] Verificação de assinatura testada em sandbox
- [ ] `back_url` apontando para `app.previando.com.br`
- [ ] Seed de `PlanLimit` rodado
- [ ] `UsageRecord` criado junto com usuário no registro
