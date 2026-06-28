# 08 — SAAS: PLANOS E PAGAMENTOS
> Freemium, Mercado Pago Subscriptions, Webhooks e WhatsApp Share
> Última atualização: 2026-06-27

---

## Planos

| | FREE | SOLO R$299/mês | PRO R$599/mês |
|---|---|---|---|
| Clientes | 3 total | 30 total | Ilimitado |
| Cálculos/mês | 5 | Ilimitado | Ilimitado |
| Pareceres IA/mês | 1 | 20 | Ilimitado |
| Notas por caso | 10 | Ilimitado | Ilimitado |
| Análises BPC/mês | 0 | 50 | Ilimitado |
| Carrosséis BPC/mês | 0 | 5 | Ilimitado |
| Simulador | ❌ | ✅ | ✅ |
| Retroativos | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ✅ | ✅ |
| WhatsApp share | ❌ | ✅ | ✅ |
| Diagnóstico IA | ❌ | ✅ | ✅ |
| Módulo BPC/LOAS | ❌ | ✅ | ✅ |
| Marca d'água | ✅ | ❌ | ❌ |

---

## Features (PlanFeature)

| Feature | Descrição | Campo no PlanLimit |
|---|---|---|
| `SIMULATOR` | Simulador de benefício | `simulatorEnabled` |
| `RETROATIVOS` | Cálculo de retroativos | `retroactiveEnabled` |
| `EXPORT_PDF` | Exportar PDF | `exportPdfEnabled` |
| `WHATSAPP_SHARE` | Compartilhar via WhatsApp | `whatsappEnabled` |
| `DIAGNOSIS` | Diagnóstico IA | `diagnosisEnabled` |
| `USE_BPC_MODULE` | Módulo BPC/LOAS | `bpcEnabled` |

> **Nota:** `BPC_SOCIAL_MEDIA` foi removido do PlanFeature. O carrossel BPC não é mais gerado via IA no backend.

---

## Fluxo de Upgrade

```
POST /api/billing/subscribe → cria subscription MP
  → MP retorna subscription.id + init_point (URL pagamento)
  → Frontend redireciona para URL MP
  → Usuário paga
  → MP dispara webhook → POST /api/webhooks/mercadopago
  → Webhook atualiza user.plan + user.planStatus
  → MP redireciona para app.previando.com.br/settings/billing?status=success
```

---

## Mercado Pago

```typescript
// src/services/mercadopago.ts
const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
export const mpPreApproval = new PreApproval(mp)

export const MP_PLAN_IDS: Record<string, string> = {
  SOLO: process.env.MP_PLAN_ID_SOLO!,
  PRO: process.env.MP_PLAN_ID_PRO!,
}
export const PLAN_PRICES: Record<string, number> = { SOLO: 299, PRO: 599 }
```

---

## Webhook Mercado Pago

- URL: `POST /api/webhooks/mercadopago`
- Verificação HMAC-SHA256 via `x-signature`, `x-request-id`, `data.id`
- **Não confia no payload** — faz fetch na API MP para dados autoritativos
- Processa: `subscription_preapproval` e `payment`
- Mapeamento de status MP → DB

---

## WhatsApp Share / Send

- Provider configurável: `WHATSAPP_PROVIDER` (zapi | meta)
- **Z-API:** via `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` + `ZAPI_CLIENT_TOKEN`
- **Meta Cloud API:** via `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN`
- Link share: `https://wa.me/{phone}?text={message}`
- Rodapé: "Calculado via Previando (app.previando.com.br)"

---

## Reset Mensal de Uso

O reset é feito **inline** na verificação de limite, não via cron:

```typescript
// src/lib/plan-guard.ts
async function getOrResetUsageRecord(userId: string) {
  // Compara ano+mês — se mudou, zera contadores
  if (!isSameMonth(now, new Date(record.usageMonthRef))) {
    // Reset calculationsThisMonth, opinionsThisMonth, bpcAnalysesThisMonth, bpcSocialMediaThisMonth
  }
}
```

---

## Guards Disponíveis

| Guard | Verifica |
|---|---|
| `guardFeature()` | Feature booleana (simulatorEnabled, bpcEnabled, etc.) |
| `guardClientLimit()` | maxClients |
| `guardCalculationLimit()` | maxCalculationsPerMonth + simulatorEnabled |
| `guardOpinionLimit()` | maxOpinionsPerMonth + diagnosisEnabled |
| `guardBpcAnalysisLimit()` | bpcAnalysesPerMonth + bpcEnabled |
| `guardBpcSocialMediaLimit()` | bpcSocialMediaPerMonth + bpcEnabled |

---

## Cache de PlanLimit

- Redis com TTL de 5 minutos
- `invalidatePlanLimitCache(plan)` em mudanças de plano

---

## Variáveis de Ambiente

```env
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""
MP_PLAN_ID_SOLO=""
MP_PLAN_ID_PRO=""
WHATSAPP_PROVIDER="zapi"         # zapi | meta
ZAPI_INSTANCE_ID=""
ZAPI_TOKEN=""
ZAPI_CLIENT_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
```

---

## Avisos de Uso no Frontend

```
80% do limite:
⚠️ "Você usou 4 de 5 cálculos este mês. Faça upgrade para ilimitado."

100% do limite:
🔴 "Limite atingido. Seu plano FREE inclui 5 simulações/mês."

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