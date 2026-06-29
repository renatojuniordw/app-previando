# 15 — Plano de Integração: TrackJud Vigilant

> Substitui completamente o DataJud (API pública CNJ) pelo TrackJud Vigilant.
> Modelo: monitoramento push (webhook), não polling. Zero abertura para pesquisa externa.
> Última atualização: 2026-06-29

---

## 1. Contexto e Motivação

**Situação atual:**
- `src/services/datajud.ts` — cliente HTTP que consulta a API pública do CNJ (ElasticSearch)
- `src/jobs/datajud-worker.ts` — worker BullMQ que faz polling diário às 09:00 de todos os casos com `processNumber`
- `POST /api/cases/[id]/process` — endpoint manual com cooldown de 10 min que chama o DataJud
- `ProcessCard.tsx` — UI que exibe os dados e oferece botão "Consultar DataJud"

**Problema:** DataJud não encontra todos os processos (gaps de cobertura e latência na agregação CNJ → tribunais).

**Solução:** TrackJud Vigilant — conexão direta com tribunais, modelo push via webhook.

**Premissa de custo:** TrackJud cobra por consulta/registro. A integração **não pode expor pesquisa livre**. O monitoramento se aplica apenas ao `processNumber` já cadastrado no caso — gerenciado pelo advogado.

---

## 2. Arquitetura da Solução

### 2.1 Modelo de Operação

```
[Advogado cadastra número CNJ no caso]
    → PATCH /api/cases/[id]
    → trackjud.registerProcess(processNumber)
    → Salva trackjudMonitorId no banco

[TrackJud detecta movimentação no tribunal]
    → POST /api/webhooks/trackjud  (push, sem custo extra)
    → Valida assinatura HMAC
    → Atualiza campos do caso
    → Cria Notification PROCESS_UPDATE

[Advogado clica "Atualizar agora" no ProcessCard]
    → POST /api/cases/[id]/process
    → trackjud.getProcess(trackjudMonitorId)  (1 consulta = 1 crédito)
    → Cooldown 10 min (já existente)
    → Atualiza campos do caso

[Advogado remove número do processo]
    → PATCH /api/cases/[id] com processNumber: null
    → trackjud.unregisterProcess(trackjudMonitorId)
    → Limpa trackjudMonitorId no banco

[Caso finalizado (FINISHED)]
    → PATCH /api/cases/[id]/status
    → trackjud.unregisterProcess(trackjudMonitorId)
    → Libera crédito de monitoramento
```

### 2.2 Por que remover o BullMQ datajud-worker?

O worker faz polling diário de **todos** os processos — substituído pelo modelo push do TrackJud. Cada movimentação nova chega via webhook sem custo adicional e em tempo real. Manter o worker seria consumo duplicado.

---

## 3. Mudanças no Banco de Dados

### 3.1 Migration: adicionar campo `trackjudMonitorId` ao modelo `Case`

```prisma
model Case {
  // ... campos existentes mantidos integralmente ...

  processNumber       String?
  processLastCheck    DateTime?
  processLastMovDate  DateTime?
  processLastMovCount Int?
  processLastSummary  String?   @db.Text

  trackjudMonitorId   String?   // ID retornado pelo TrackJud ao registrar monitoramento
  trackjudRegisteredAt DateTime? // Data do registro no TrackJud

  // ... resto igual ...
}
```

**Arquivo:** `prisma/schema.prisma`

**Migration SQL gerada pelo Prisma:**
```sql
ALTER TABLE "cases" ADD COLUMN "trackjudMonitorId" TEXT;
ALTER TABLE "cases" ADD COLUMN "trackjudRegisteredAt" TIMESTAMP(3);
```

**Índice opcional** (se TrackJud precisar buscar caso pelo monitorId no webhook):
```prisma
@@index([trackjudMonitorId])
```

---

## 4. Variáveis de Ambiente

Adicionar no `.env` e `.env.example`:

```env
# TrackJud Vigilant
TRACKJUD_API_KEY=        # Chave de API fornecida pelo TrackJud
TRACKJUD_WEBHOOK_SECRET= # Secret HMAC para validar webhooks recebidos
TRACKJUD_BASE_URL=https://api.trackjud.com.br  # Confirmar URL real com a TrackJud
```

---

## 5. Arquivos a Deletar

| Arquivo | Motivo |
|---|---|
| `src/services/datajud.ts` | Substituído por `src/services/trackjud.ts` |
| `src/jobs/datajud-worker.ts` | Substituído pelo modelo push (webhook) |

---

## 6. Arquivos a Criar

### 6.1 `src/services/trackjud.ts`

Responsabilidade única: encapsular toda comunicação HTTP com a API TrackJud.

Seguindo **SRP** (Single Responsibility) e **DIP** (Dependency Inversion) via interface exportada:

```typescript
// Interface pública — desacopla o serviço dos consumidores
export interface IProcessMonitor {
  registerProcess(processNumber: string): Promise<{ monitorId: string }>
  unregisterProcess(monitorId: string): Promise<void>
  getProcess(monitorId: string): Promise<ProcessSnapshot | null>
}

export interface ProcessSnapshot {
  processNumber: string
  tribunal: string
  classeProcessual?: string
  assuntos?: string[]
  dataAjuizamento?: string
  ultimaMovimentacao?: { data: string; descricao: string }
  totalMovimentacoes: number
  urlExterno?: string
}

// Implementação concreta
export class TrackJudService implements IProcessMonitor {
  // registerProcess(processNumber): POST /monitors → retorna { monitorId }
  // unregisterProcess(monitorId): DELETE /monitors/{monitorId}
  // getProcess(monitorId): GET /monitors/{monitorId}/snapshot
}

// Singleton exportado para uso nas rotas
export const trackjud = new TrackJudService()
```

**Notas de implementação:**
- Usar `fetch` nativo com `AbortSignal.timeout(10_000)` (padrão do projeto)
- Tratar erros HTTP com throw tipado — não silenciar falhas de registro
- Confirmar endpoints reais na documentação da TrackJud antes de implementar
- Adicionar `Authorization: Bearer ${TRACKJUD_API_KEY}` em todos os requests

---

### 6.2 `src/app/api/webhooks/trackjud/route.ts`

Responsabilidade: receber notificações push do TrackJud e atualizar o caso correspondente.

```typescript
// Fluxo:
// 1. Validar assinatura HMAC-SHA256 no header X-TrackJud-Signature
// 2. Extrair monitorId do payload
// 3. Buscar caso por trackjudMonitorId
// 4. Atualizar processLastCheck, processLastMovDate, processLastMovCount, processLastSummary
// 5. Criar Notification PROCESS_UPDATE (com deduplicação de 24h — já existe no datajud-worker)
// 6. Responder 200 imediatamente (TrackJud faz retry se receber != 2xx)

export async function POST(req: NextRequest) { ... }
```

**Segurança:**
- Endpoint público mas com validação HMAC obrigatória — rejeita sem assinatura válida
- Busca caso apenas por `trackjudMonitorId` — nunca por processNumber livre (previne abuso)
- Rate limit: 100 req/min por IP (usando `rate-limit.ts` existente)
- Não requer autenticação de usuário (é chamado pelo TrackJud, não pelo browser)

**Payload esperado do TrackJud** (confirmar na documentação real):
```typescript
interface TrackJudWebhookPayload {
  monitorId: string
  processNumber: string
  event: 'movement' | 'update'
  movements: Array<{
    date: string
    description: string
    code?: string
  }>
  totalMovements: number
  timestamp: string
}
```

---

## 7. Arquivos a Modificar

### 7.1 `prisma/schema.prisma`

Adicionar os dois campos ao model `Case` (ver seção 3.1).

---

### 7.2 `src/app/api/cases/[id]/route.ts` — método PATCH/PUT

Localizar o handler de edição do caso e adicionar lógica de registro/cancelamento TrackJud.

**Lógica a inserir após `prisma.case.update()`:**

```typescript
// Após salvar o caso no banco:
const oldProcessNumber = caso.processNumber         // valor antes do update
const newProcessNumber = data.processNumber ?? null  // valor recebido no body

if (newProcessNumber !== oldProcessNumber) {
  if (oldProcessNumber && caso.trackjudMonitorId) {
    // Processo removido ou trocado → cancela monitoramento anterior
    await trackjud.unregisterProcess(caso.trackjudMonitorId).catch(() => null)
    await prisma.case.update({
      where: { id: params.id },
      data: { trackjudMonitorId: null, trackjudRegisteredAt: null },
    })
  }

  if (newProcessNumber) {
    // Processo novo → registra no TrackJud
    try {
      const { monitorId } = await trackjud.registerProcess(newProcessNumber)
      await prisma.case.update({
        where: { id: params.id },
        data: { trackjudMonitorId: monitorId, trackjudRegisteredAt: new Date() },
      })
    } catch (err) {
      // Não bloqueia o save do caso — loga e continua
      logger.warn(`Falha ao registrar processo ${newProcessNumber} no TrackJud`, err)
    }
  }
}
```

**Princípio SOLID aplicado:** O route handler não conhece detalhes do TrackJud (DIP) — depende da interface `IProcessMonitor`.

---

### 7.3 `src/app/api/cases/[id]/status/route.ts`

Quando status muda para `FINISHED`, cancelar monitoramento:

```typescript
if (newStatus === 'FINISHED' && caso.trackjudMonitorId) {
  await trackjud.unregisterProcess(caso.trackjudMonitorId).catch(() => null)
  await prisma.case.update({
    where: { id: params.id },
    data: { trackjudMonitorId: null, trackjudRegisteredAt: null },
  })
}
```

---

### 7.4 `src/app/api/cases/[id]/process/route.ts`

Substituir import do DataJud pelo TrackJud:

**Remover:**
```typescript
import { queryProcess } from '@/services/datajud'
```

**Adicionar:**
```typescript
import { trackjud } from '@/services/trackjud'
```

**Ajustar o POST handler:**
- Verificar se `caso.trackjudMonitorId` existe — se não, retornar 400 com mensagem "Processo ainda não registrado para monitoramento."
- Chamar `trackjud.getProcess(caso.trackjudMonitorId)` ao invés de `queryProcess(caso.processNumber)`
- Mapear `ProcessSnapshot` para os mesmos campos do banco (sem mudança de schema de resposta)
- Manter o cooldown de 10 minutos (já existente)

**Ajustar o response JSON:**
- Renomear `datajud` para `process` no response (breaking change controlado — apenas o frontend consome)

---

### 7.5 `src/app/(dashboard)/cases/[id]/_components/ProcessCard.tsx`

**Mudanças de UX/UI:**

1. **Badge de status do monitoramento** (novo) — no header do card:
   - Verde `● Monitoramento ativo` quando `caseData.trackjudMonitorId` existe
   - Cinza `○ Não monitorado` quando não existe (processo não cadastrado ou registro falhou)

2. **Substituir textos:**
   - "Consultar DataJud" → "Atualizar agora"
   - Mensagem de not-yet-checked: "Aguardando primeira movimentação do TrackJud ou clique em Atualizar."
   - Link PJe: manter (independente do TrackJud)

3. **Empty state** (quando não há processNumber): manter igual, apenas trocar
   - "Nenhum número de processo cadastrado." (sem menção ao DataJud)

4. **Prop adicional:** receber `trackjudMonitorId: string | null` via `caseData` para renderizar o badge

**Wireframe do card:**
```
┌─────────────────────────────────────────────────────┐
│  Acompanhamento Processual         ● Monitoramento ativo │
│                                    [Atualizar agora]    │
├─────────────────────────────────────────────────────┤
│  Número do Processo                           PJe ↗ │
│  1234567-89.2024.4.03.6100                          │
├─────────────────────────────────────────────────────┤
│  Última consulta  │ Últ. movimentação │ Total movs.  │
│  29/06/2026       │ 28/06/2026        │ 14           │
├─────────────────────────────────────────────────────┤
│  Última movimentação                                │
│  "Conclusos ao Juiz para julgamento"                │
└─────────────────────────────────────────────────────┘
```

**Wireframe sem processo:**
```
┌─────────────────────────────────────────────────────┐
│         🔍                                          │
│  Nenhum número de processo cadastrado.              │
│              [Adicionar número]                     │
└─────────────────────────────────────────────────────┘
```

---

### 7.6 `src/app/(dashboard)/cases/[id]/_hooks/useCaseOverview.ts`

Atualizar `handleCheckProcess`:
- Substituir referências a `datajud` no response (`r.data.datajud` → `r.data.process`)
- Atualizar mensagens de toast:
  - "Movimentações sincronizadas com o DataJud." → "Movimentações sincronizadas com o TrackJud."
  - "Nenhum resultado retornado pelo DataJud." → "Nenhum dado retornado pelo TrackJud."

---

### 7.7 `src/app/(dashboard)/cases/[id]/_types.ts`

Adicionar campos novos ao tipo `CaseDetail`:

```typescript
trackjudMonitorId: string | null
trackjudRegisteredAt: string | null
```

---

### 7.8 `src/jobs/worker.ts`

Remover toda referência ao datajud-worker:

```typescript
// REMOVER:
import { createDatajudWorker, scheduleDatajudJob } from './datajud-worker'
// ... e as chamadas correspondentes
```

---

## 8. IA: Vale integrar?

### Análise de custo-benefício

O `processLastSummary` contém texto cru do tribunal ("Juntada de petição", "Conclusos ao juiz para sentença", "Citação via carta precatória"). O advogado previdenciário precisa saber se a movimentação **exige ação imediata** ou é informativa.

**Recomendação: SIM, com IA on-demand (não automática)**

Implementar um botão "Interpretar" no card de movimentação — o advogado aciona quando quiser, não dispara automaticamente em cada webhook.

**Por que não automático?**
- Cada webhook de movimento custaria uma chamada de IA → custo não previsível
- Em casos ativos com muitos movimentos, poderia multiplicar o custo de IA

**Por que on-demand faz sentido?**
- Custo zero no webhook (push gratuito do TrackJud)
- Custo de IA apenas quando o advogado clica — comportamento análogo ao parecer e diagnóstico existentes
- `gpt-4.1-nano` é suficiente para classificação (mais barato do portfólio)

### Especificação da feature de IA

**Endpoint:** `POST /api/cases/[id]/process/interpret`

**Input:** `processLastSummary` + `processLastMovDate` + `benefitType` do caso

**Output:**
```typescript
{
  urgency: 'CRITICAL' | 'ACTION_REQUIRED' | 'INFORMATIVE',
  urgencyLabel: string,     // Ex: "Prazo iminente", "Resposta necessária", "Informativo"
  interpretation: string,   // 1-2 frases em português jurídico simplificado
  suggestedAction?: string  // Ex: "Verificar prazo para recurso"
}
```

**Prompt (sistema):** Especialista em direito previdenciário. Classifica movimentações processuais por urgência para o advogado. Resposta JSON sempre em português.

**UX:** Botão "Interpretar com IA" abaixo do `processLastSummary` no ProcessCard. Exibe resultado inline (sem modal). Modelo `gpt-4.1-nano`. Custo ~R$ 0,002/interpretação.

**Plano:** SOLO e PRO (por ser feature de IA de valor agregado).

---

## 9. Plano de Limite por Plano

| Feature | FREE | SOLO | PRO |
|---|---|---|---|
| Cadastrar número de processo | ✅ | ✅ | ✅ |
| Monitoramento automático (webhook) | ✅ | ✅ | ✅ |
| Atualizar manualmente (cooldown 10min) | ✅ | ✅ | ✅ |
| Interpretar movimentação com IA | ❌ | ✅ | ✅ |

> O monitoramento é ativado para todos os planos — é uma feature core do produto, não diferenciador de plano. O diferencial de IA (interpretação) fica em SOLO/PRO.

**Importante:** Não adicionar a feature de interpretação ao `PlanLimit` do banco agora, a menos que você queira limitá-la por quantidade mensal. Como primeiro passo, basta verificar `plan !== 'FREE'` no endpoint.

---

## 10. Segurança

| Risco | Mitigação |
|---|---|
| Webhook falso injetando movimentações | Validação HMAC-SHA256 obrigatória com `TRACKJUD_WEBHOOK_SECRET` |
| Webhook processando caso de outro usuário | Busca sempre por `trackjudMonitorId` — o ID é interno e opaco |
| Consulta manual excessiva (custo TrackJud) | Cooldown 10 min já existente no endpoint POST |
| Pesquisa externa via processNumber | Nunca expor endpoint de busca livre — apenas por `trackjudMonitorId` |
| IDOR no webhook | Caso encontrado só pelo monitorId — sem validação de userId necessária (o monitorId já é o escopo) |

---

## 11. Sequência de Implementação

### Fase 1 — Backend (sem quebrar UI existente)

1. Adicionar variáveis de ambiente ao `.env.example`
2. Rodar migration do Prisma (adicionar `trackjudMonitorId`, `trackjudRegisteredAt`)
3. Criar `src/services/trackjud.ts` com interface + implementação
4. Criar `src/app/api/webhooks/trackjud/route.ts`
5. Modificar `src/app/api/cases/[id]/route.ts` — lógica register/unregister
6. Modificar `src/app/api/cases/[id]/status/route.ts` — unregister no FINISHED
7. Modificar `src/app/api/cases/[id]/process/route.ts` — trocar DataJud por TrackJud
8. Remover `src/services/datajud.ts`
9. Remover `src/jobs/datajud-worker.ts` e referências em `worker.ts`

### Fase 2 — Frontend

10. Atualizar `_types.ts` com os novos campos
11. Atualizar `ProcessCard.tsx` — badge de monitoramento, textos, wireframe
12. Atualizar `useCaseOverview.ts` — mensagens de toast

### Fase 3 — IA (opcional, implementar depois)

13. Criar `src/app/api/cases/[id]/process/interpret/route.ts`
14. Adicionar botão "Interpretar com IA" no `ProcessCard.tsx`

---

## 12. Testes Manuais (Golden Path)

Após implementação, validar:

1. **Cadastrar processo novo:**
   - Editar caso → informar número CNJ → salvar
   - Verificar no banco: `trackjudMonitorId` preenchido
   - Verificar no ProcessCard: badge "● Monitoramento ativo"

2. **Receber webhook:**
   - Usar ferramenta como Insomnia/cURL para simular POST em `/api/webhooks/trackjud`
   - Com assinatura HMAC válida → caso atualizado, notificação criada
   - Com assinatura inválida → 401 retornado

3. **Atualizar manualmente:**
   - Clicar "Atualizar agora" → dados sincronizados
   - Clicar novamente em < 10 min → erro de cooldown

4. **Remover processo:**
   - Editar caso → limpar número → salvar
   - Verificar no banco: `trackjudMonitorId: null`
   - ProcessCard exibe empty state

5. **Finalizar caso:**
   - Mudar status para FINISHED
   - Verificar no banco: `trackjudMonitorId: null` (monitoramento cancelado)

6. **Segurança:**
   - POST no webhook sem header de assinatura → 401
   - POST com `monitorId` inexistente → 404 (não retorna 200 falso)

---

## 13. Referências de Código Existente (para o novo chat)

| O que precisar | Onde está |
|---|---|
| Padrão de serviço externo | `src/services/whatsapp.ts` ou `src/services/mercadopago.ts` |
| Padrão de webhook com validação | `src/app/api/webhooks/mercadopago/route.ts` |
| Notificação PROCESS_UPDATE | `src/jobs/datajud-worker.ts` (linhas 52-70, lógica de deduplicação) |
| Cooldown de 10 min | `src/app/api/cases/[id]/process/route.ts` (linhas 54-63) |
| Rate limit pattern | `src/lib/rate-limit.ts` |
| HMAC validation | Não existe ainda — criar inline no webhook route |
| Card component | `src/app/(dashboard)/cases/[id]/_components/ProcessCard.tsx` |
| Plan guard | `src/lib/plan-guard.ts` → `guardFeature()` |
| Logger | `src/lib/logger.ts` → `new Logger('TrackJudService')` |
| API error handler | `src/lib/api-error.ts` → `handleApiError()` |
| Ownership check | `src/lib/ownership.ts` → `verifyCaseOwnership()` |
