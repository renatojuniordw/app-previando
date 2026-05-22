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
//    - subscription_preapproval → atualizar plan + planStatus
//    - payment → registrar em payments (evitar duplicatas)

function verifyMPSignature(body: string, signature: string, requestId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET!
  const manifest = `id:${requestId};request-body:${body};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  const received = signature.split(',').find(p => p.startsWith('v1='))?.replace('v1=', '') ?? ''
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}

// Mapeamento de status MP → PlanStatus
const statusMap = {
  authorized: 'ACTIVE',
  paused:     'PAST_DUE',
  cancelled:  'CANCELLED',
  pending:    'ACTIVE',
}
```

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

## Checklist de Pagamentos (pré-deploy)

- [ ] Planos criados no painel Mercado Pago (SOLO R$299 e PRO R$599)
- [ ] IDs dos planos configurados nas env vars
- [ ] Webhook configurado no MP: `https://app.previando.com.br/api/webhooks/mercadopago`
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` igual ao configurado no MP
- [ ] Verificação de assinatura testada em sandbox
- [ ] `back_url` apontando para `app.previando.com.br`
- [ ] Seed de `PlanLimit` rodado
- [ ] `UsageRecord` criado junto com usuário no registro
