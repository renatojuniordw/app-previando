# 02 — BACKEND
> API Routes, Calculadoras, Prontuário, BullMQ e OCR

---

## Dependências

```bash
npm install next react react-dom \
  next-auth @auth/prisma-adapter bcryptjs \
  prisma @prisma/client \
  bullmq ioredis \
  pdf-parse tesseract.js \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  openai mercadopago \
  isomorphic-dompurify \
  @dnd-kit/core @dnd-kit/sortable \
  react-hook-form zod zustand recharts axios \
  date-fns

npm install --save-dev \
  @types/node @types/react @types/react-dom \
  @types/bcryptjs @types/pdf-parse \
  typescript eslint prettier
```

---

## Extração de PDF com Fallback OCR

```typescript
// services/cnis/pdf-extractor.ts
// pdf-parse → se < 100 chars → Tesseract.js (lang: 'por')
// Ver implementação completa na versão anterior do documento
```

---

## BullMQ

```typescript
// Filas: cnis-processing, crons
// Crons: reset-usage (dia 1), update-priorities (diário), cleanup-pdfs (semanal)
// Worker em container separado (Dockerfile.worker)
```

---

## Mapa Completo de API Routes

```
── AUTH ──────────────────────────────────────────────────────
POST  /api/auth/[...nextauth]
POST  /api/auth/register

── USAGE ─────────────────────────────────────────────────────
GET   /api/usage

── CLIENTS ───────────────────────────────────────────────────
GET   /api/clients
POST  /api/clients                  (verifica CREATE_CLIENT)
GET   /api/clients/:id
PUT   /api/clients/:id
DELETE /api/clients/:id
PATCH /api/clients/:id/priority

── CASES ─────────────────────────────────────────────────────
GET   /api/cases
POST  /api/cases
GET   /api/cases/:id
PUT   /api/cases/:id
PATCH /api/cases/:id/status
DELETE /api/cases/:id

── PRONTUÁRIO ────────────────────────────────────────────────
GET   /api/cases/:id/notes          Lista (filtro: type, order)
POST  /api/cases/:id/notes          Cria entrada (verifica CREATE_NOTE)
GET   /api/cases/:id/notes/diagnosis Diagnóstico IA (verifica GENERATE_DIAGNOSIS)

── CNIS ──────────────────────────────────────────────────────
POST  /api/cnis/upload
GET   /api/cnis/:caseId
GET   /api/cnis/:caseId/status
DELETE /api/cnis/:caseId

── CALCULATOR ────────────────────────────────────────────────
GET   /api/calculator/modalidades
POST  /api/cases/:id/calculations   (verifica RUN_CALCULATION)
GET   /api/cases/:id/calculations
PATCH /api/cases/:id/calculations/:cId/select
DELETE /api/cases/:id/calculations/:cId

── RETROATIVOS ───────────────────────────────────────────────
POST  /api/cases/:id/retroativos    (verifica USE_RETROATIVOS)
GET   /api/cases/:id/retroativos

── SIMULAÇÕES ────────────────────────────────────────────────
POST  /api/cases/:id/simulations    (verifica USE_SIMULATOR)
GET   /api/cases/:id/simulations
DELETE /api/cases/:id/simulations/:sId

── CHECKLIST ─────────────────────────────────────────────────
POST  /api/cases/:id/checklist
GET   /api/cases/:id/checklist

── PARECERES ─────────────────────────────────────────────────
POST  /api/cases/:id/opinions       (verifica GENERATE_OPINION)
GET   /api/cases/:id/opinions
PUT   /api/cases/:id/opinions/:oId

── EXPORT ────────────────────────────────────────────────────
GET   /api/export/pdf/:caseId       (verifica EXPORT_PDF)
GET   /api/export/whatsapp/:caseId  (verifica WHATSAPP_SHARE)

── BILLING ───────────────────────────────────────────────────
GET   /api/billing/plans
POST  /api/billing/subscribe
POST  /api/billing/cancel
POST  /api/webhooks/mercadopago

── DASHBOARD ─────────────────────────────────────────────────
GET   /api/dashboard/summary
GET   /api/dashboard/deadlines

── ADMIN ─────────────────────────────────────────────────────
GET   /api/admin/users
GET   /api/admin/metrics
PATCH /api/admin/users/:id/plan
PATCH /api/admin/plans/:plan
GET   /api/admin/payments
```

---

## 🏛️ Camada de Serviços (Service Layer) e Motores de Cálculo

Buscando conformidade estrita com a **Clean Architecture** e garantindo que as regras previdenciárias e projeções financeiras fiquem 100% blindadas de vazamentos ou fraudes, o backend implementa uma Service Layer isolada:

### 1. PrevidenciaService (`src/services/previdencia-service.ts`)
Esta é a classe centralizadora que orquestra toda a lógica previdenciária. Ela executa de forma síncrona e segura:
* **Cálculos (`runAndSaveCalculation`):** Carrega o CNIS processado do banco, obtém o teto/salário do banco de dados na data da DIB, executa o motor previdenciário do domínio e grava o resultado verificado no banco de dados.
* **Simulações (`runAndSaveSimulation`):** Orquestra projeções de contribuições futuras mesclando o CNIS atual com cenários projetados, salvando de forma íntegra.
* **Retroativos (`runAndSaveRetroativo`):** Carrega os índices de atualização do INPC reais da tabela `indices_inpc` e computa o mês a mês da liquidação com atualização monetária oficial.

### 2. Motores do Domínio (Domain Engines)
As regras matemáticas puras residem em arquivos desacoplados e sem dependências assíncronas de banco (Funções Puras):
* **Cálculo de Elegibilidade e RMI:** [previdencia-engine.ts](file:///Users/renatobezerra/Reposit%C3%B3rios/Previando/src/lib/previdencia-engine.ts)
* **Correção e Parcelamento Monetário (INPC):** [retroativos-engine.ts](file:///Users/renatobezerra/Reposit%C3%B3rios/Previando/src/lib/retroativos-engine.ts)

