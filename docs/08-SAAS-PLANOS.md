# 08 — SAAS: PLANOS E PAGAMENTOS
> Freemium, Mercado Pago Subscriptions, Webhooks e WhatsApp Share

---

## Planos

| | FREE | SOLO R$299/mês | PRO R$599/mês |
|---|---|---|---|
| Clientes | 3 total | 30 total | Ilimitado |
| Simulações/mês | 5 | Ilimitado | Ilimitado |
| Consultas IA/mês | 1 | 20 | Ilimitado |
| Análises BPC/mês | 0 | 50 | Ilimitado |
| Carrosséis BPC/mês | 0 | 5 | Ilimitado |
| Notas por caso | 10 | Ilimitado | Ilimitado |
| Simulador | ❌ | ✅ | ✅ |
| Retroativos | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ✅ | ✅ |
| WhatsApp share | ❌ | ✅ | ✅ |
| Diagnóstico IA | ❌ | ✅ | ✅ |
| Módulo BPC/LOAS | ❌ | ✅ | ✅ |
| Gerador carrossel BPC | ❌ | ✅ | ✅ |
| Marca d'água | ✅ | ❌ | ❌ |

---

## Features (PlanFeature)

As features verificadas via `guardFeature()` em `src/lib/plan-guard.ts`:

| Feature | Descrição | Campo no PlanLimit |
|---|---|---|
| `SIMULATOR` | Simulador de benefício | `simulatorEnabled` |
| `RETROATIVOS` | Cálculo de retroativos | `retroactiveEnabled` |
| `EXPORT_PDF` | Exportar PDF | `exportPdfEnabled` |
| `WHATSAPP_SHARE` | Compartilhar via WhatsApp | `whatsappEnabled` |
| `DIAGNOSIS` | Diagnóstico IA | `diagnosisEnabled` |
| `USE_BPC_MODULE` | Módulo BPC/LOAS | `bpcEnabled` |
| `BPC_SOCIAL_MEDIA` | Gerador de carrossel BPC | `bpcEnabled` |

---

## Fluxo de Upgrade

```
[POST /api/billing/subscribe] → cria subscription no MP
    → MP retorna subscription.id + init_point (URL de pagamento)
    → frontend redireciona usuário para URL do MP
    → usuário paga
    → MP dispara webhook → POST /api/webhooks/mercadopago
    → webhook atualiza user.plan + user.planStatus no banco
    → MP redireciona para app.previando.com.br/settings/billing?status=success
```

---

## Mercado Pago

```typescript
// src/services/mercadopago.ts
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const mpPreApproval = new PreApproval(mp)

export const MP_PLAN_IDS: Record<string, string> = {
  SOLO: process.env.MP_PLAN_ID_SOLO!,
  PRO:  process.env.MP_PLAN_ID_PRO!,
}

export const PLAN_PRICES: Record<string, number> = {
  SOLO: 299,
  PRO: 599,
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
      transaction_amount: PLAN_PRICES[plan],
      currency_id: 'BRL',
    },
  }
})

return { subscriptionId: subscription.id, initPoint: subscription.init_point }
```

---

## Webhook Mercado Pago

```typescript
// POST /api/webhooks/mercadopago

// 1. Verificar assinatura criptográfica HMAC-SHA256
//    Formato: id:dataId;request-id:requestId;ts:timestamp;
//    data.id vem da query string da URL do MP
//    x-signature e x-request-id vêm dos headers
// 2. Processar evento por tipo:
//    - subscription_preapproval → busca detalhes via API MP, atualiza plan + planStatus (em prisma.$transaction)
//    - payment                 → busca detalhes via API MP, registra em payments (upsert por mpPaymentId)
// 3. Invalidar cache de plano após mudança: invalidatePlanLimitCache(plan)

function verifyWebhookSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  const dataId = req.nextUrl.searchParams.get('data.id')

  const ts = xSignature.split(';').find(p => p.startsWith('ts='))?.replace('ts=', '')
  const v1 = xSignature.split(';').find(p => p.startsWith('v1='))?.replace('v1=', '')

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  return expected === v1
}

// Mapeamento de status de assinatura MP → planStatus
function mapMpSubscriptionStatus(mpStatus: string): string {
  const map: Record<string, string> = {
    authorized: 'ACTIVE',
    paused:     'PAST_DUE',
    cancelled:  'CANCELLED',
    pending:    'ACTIVE',
    suspended:  'SUSPENDED',
  }
  return map[mpStatus] ?? 'ACTIVE'
}

// Mapeamento de status de pagamento MP → PaymentStatus enum (prisma)
function mapMpPaymentStatus(mpStatus: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    pending:      'PENDING',
    approved:     'APPROVED',
    authorized:   'APPROVED',
    in_process:   'PENDING',
    in_mediation: 'PENDING',
    rejected:     'REJECTED',
    cancelled:    'CANCELLED',
    refunded:     'REFUNDED',
    charged_back: 'REFUNDED',
  }
  return map[mpStatus] ?? 'PENDING'
}
```

> **Importante:** O webhook não confia nos dados do payload. Faz fetch na API do MP (`/preapproval/{id}` para assinaturas, `/v1/payments/{id}` para pagamentos) para obter os dados autoritativos.

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

O reset dos contadores mensais é feito **inline** na verificação de limite, não via cron job.

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

## API: Planos Disponíveis

```typescript
// GET /api/billing/plans — retorna todos os planos com limites para o frontend

{
  plans: [
    {
      plan: 'FREE',
      price: 0,
      limits: { /* PlanLimit completo */ }
    },
    // ...
  ]
}
```

---

## Guards Disponíveis

| Guard | Função | Verifica |
|---|---|---|
| `guardFeature()` | Feature booleana | `simulatorEnabled`, `diagnosisEnabled`, `bpcEnabled`, etc. |
| `guardClientLimit()` | Limite de clientes | `maxClients` (-1 = ilimitado) |
| `guardCalculationLimit()` | Simulações/mês | `maxCalculationsPerMonth` + `simulatorEnabled` |
| `guardOpinionLimit()` | Consultas IA/mês | `maxOpinionsPerMonth` + `diagnosisEnabled` |
| `guardBpcAnalysisLimit()` | Análises BPC/mês | `bpcAnalysesPerMonth` + `bpcEnabled` |
| `guardBpcSocialMediaLimit()` | Carrosséis BPC/mês | `bpcSocialMediaPerMonth` + `bpcEnabled` |

---

## Cache de PlanLimit

Os limites de plano são cacheados em Redis com TTL de 5 minutos (`PLAN_LIMIT_TTL = 300`). A função `invalidatePlanLimitCache(plan)` remove a entrada do cache após mudanças de plano (ex: webhook de assinatura).

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
🔴 "Limite atingido. Seu plano FREE inclui 5 simulações/mês." [Fazer upgrade]

Feature bloqueada:
🔒 Botão com tooltip + clique abre modal de upgrade
```

---

## Verificação de Assinatura do Webhook

O webhook do Mercado Pago valida a assinatura HMAC-SHA256 usando `x-signature`, `x-request-id` e `data.id` (query string) no formato oficial do MP. Rejeita com 401 se inválida.

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
