# 02 — BACKEND
> API Routes, Calculadoras, Prontuário, Datajud, BullMQ e OCR

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

> **Datajud:** API pública do CNJ — sem SDK adicional. Consumida via `fetch` nativo com tipagem manual.

---

## Service: Datajud

```typescript
// services/datajud/index.ts

const DATAJUD_BASE = process.env.DATAJUD_BASE_URL ?? 'https://api-publica.datajud.cnj.jus.br'

// Regex de validação do número CNJ
// Formato: 0001234-55.2024.4.03.6183
export const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/

export function isValidCNJ(numero: string): boolean {
  return CNJ_REGEX.test(numero.trim())
}

/**
 * Extrai o código do tribunal do número CNJ
 * Posição J.TT no formato NNNNNNN-DD.AAAA.J.TT.OOOO
 * Ex: 0001234-55.2024.4.03.6183 → tribunal "4.03" → TRF3
 */
function extractTribunal(numeroProcesso: string): string {
  // Remove traços e pontos para parsear
  // Segmento J.TT é o 5º e 6º grupos
  const parts = numeroProcesso.replace('-', '.').split('.')
  // parts: [NNNNNNN, DD, AAAA, J, TT, OOOO]
  const J  = parts[3]
  const TT = parts[4]

  // Mapear para endpoint Datajud
  const TRIBUNAL_MAP: Record<string, string> = {
    '4.01': 'api_publica_trf1',
    '4.02': 'api_publica_trf2',
    '4.03': 'api_publica_trf3',
    '4.04': 'api_publica_trf4',
    '4.05': 'api_publica_trf5',
    '4.06': 'api_publica_trf6',
    '3.00': 'api_publica_stj',
    '1.00': 'api_publica_stf',
    // Estaduais mais comuns
    '8.26': 'api_publica_tjsp',
    '8.19': 'api_publica_tjrj',
    '8.13': 'api_publica_tjmg',
  }

  return TRIBUNAL_MAP[`${J}.${TT}`] ?? `api_publica_trf${TT}`
}

export interface DatajudMovimentacao {
  dataHora: string
  nome: string
  complemento?: string
  complementosTabelados?: Array<{ nome: string; valor: string }>
}

export interface DatajudResponse {
  numeroProcesso: string
  dataAjuizamento: string
  dataUltimaAtualizacao: string
  movimentos: DatajudMovimentacao[]
  totalMovimentos: number
}

/**
 * Consulta o andamento do processo no Datajud
 * Retorna movimentações ordenadas da mais recente para a mais antiga
 */
export async function consultarProcesso(numeroProcesso: string): Promise<DatajudResponse> {
  const tribunal = extractTribunal(numeroProcesso)
  const endpoint = `${DATAJUD_BASE}/${tribunal}/_search`

  const body = {
    query: {
      match: { numeroProcesso }
    },
    sort: [{ dataHora: { order: 'desc' } }],
    size: 1
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000), // 15s timeout
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Datajud retornou erro ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const hit = data?.hits?.hits?.[0]?._source

  if (!hit) {
    throw new Error('Processo não encontrado no Datajud. Verifique o número CNJ.')
  }

  const movimentos: DatajudMovimentacao[] = (hit.movimentos ?? [])
    .sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
    .slice(0, 20) // Limitar às 20 mais recentes para enviar à IA

  return {
    numeroProcesso: hit.numeroProcesso,
    dataAjuizamento: hit.dataAjuizamento,
    dataUltimaAtualizacao: hit.dataUltimaAtualizacao,
    movimentos,
    totalMovimentos: hit.movimentos?.length ?? 0,
  }
}
```

---

## Service: Resumo do Processo com IA

```typescript
// services/datajud/summarize.ts

import { openai } from '@/lib/openai'
import { sanitizeForAI } from '@/lib/security/ai-sanitizer'
import type { DatajudResponse } from './index'

/**
 * Gera resumo do andamento processual em linguagem clara
 * para o advogado ler e/ou enviar ao cliente
 */
export async function summarizeProcesso(
  processo: DatajudResponse,
  clientName: string
): Promise<{ summary: string; tokensUsed: number; costUsd: number }> {

  // Formatar movimentações para a IA
  const movimentacoesTexto = processo.movimentos
    .map(m => {
      const data = new Date(m.dataHora).toLocaleDateString('pt-BR')
      const hora = new Date(m.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const complemento = m.complemento ? ` — ${sanitizeForAI(m.complemento)}` : ''
      return `[${data} ${hora}] ${sanitizeForAI(m.nome)}${complemento}`
    })
    .join('\n')

  const userPrompt = `
Analise as movimentações processuais abaixo e gere um resumo claro para o cliente.

CLIENTE: ${sanitizeForAI(clientName)}
PROCESSO: ${processo.numeroProcesso}
DATA DE AJUIZAMENTO: ${new Date(processo.dataAjuizamento).toLocaleDateString('pt-BR')}
ÚLTIMA ATUALIZAÇÃO: ${new Date(processo.dataUltimaAtualizacao).toLocaleDateString('pt-BR')}
TOTAL DE MOVIMENTAÇÕES: ${processo.totalMovimentos}

ÚLTIMAS MOVIMENTAÇÕES:
${movimentacoesTexto}

Gere um resumo com:
1. Situação atual do processo (1-2 frases simples)
2. Última movimentação e o que significa para o cliente
3. Próximo passo esperado (se identificável)

REGRAS ABSOLUTAS:
- Use linguagem simples — o cliente não é advogado
- Nunca invente informações que não estão nas movimentações
- Máximo 150 palavras
- Sempre termine com: "Para mais informações, consulte seu advogado."
- Não use termos jurídicos sem explicação
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    temperature: 0.2, // Baixa — queremos precisão, não criatividade
    messages: [
      {
        role: 'system',
        content: `Você é um assistente que resume andamentos processuais em linguagem acessível para leigos.
Use sempre português claro e simples.
Nunca invente informações — use apenas o que está nas movimentações fornecidas.`
      },
      { role: 'user', content: userPrompt }
    ]
  })

  const summary = response.choices[0]?.message?.content ?? ''
  const tokensUsed = response.usage?.total_tokens ?? 0
  const costUsd = (tokensUsed * 0.7 * 0.00000015) + (tokensUsed * 0.3 * 0.0000006)

  return { summary, tokensUsed, costUsd }
}
```

---

## API Route: Consultar Processo

```typescript
// app/api/cases/[id]/process/route.ts

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertPlanAllows, PlanLimitError } from '@/services/billing/plan-guard'
import { consultarProcesso } from '@/services/datajud'
import { summarizeProcesso } from '@/services/datajud/summarize'
import { isValidCNJ } from '@/services/datajud'
import { differenceInHours } from 'date-fns'
import { rateLimit } from '@/lib/redis'

const CACHE_HOURS = 4 // Cache de 4 horas

/**
 * GET /api/cases/:id/process
 * Consulta andamento do processo no Datajud com cache inteligente
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Rate limit: 10 consultas por hora por usuário
    const limit = await rateLimit(`datajud:${session.user.id}`, 10, 3600)
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Limite de consultas atingido. Tente novamente em 1 hora.' },
        { status: 429 }
      )
    }

    // Verificar plano
    try {
      await assertPlanAllows(session.user.id, 'USE_DATAJUD')
    } catch (e) {
      if (e instanceof PlanLimitError) {
        return NextResponse.json(
          { error: e.message, feature: e.feature, upgradeRequired: e.upgradeRequired, type: 'PLAN_LIMIT' },
          { status: 402 }
        )
      }
      throw e
    }

    // Buscar caso e verificar ownership
    const caso = await prisma.case.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { client: { select: { name: true } } }
    })

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    if (!caso.processNumber) {
      return NextResponse.json(
        { error: 'Número de processo não cadastrado neste caso.' },
        { status: 400 }
      )
    }

    // ── Lógica de Cache ─────────────────────────────────────
    const agora = new Date()
    const cacheValido =
      caso.processLastCheck !== null &&
      differenceInHours(agora, caso.processLastCheck) < CACHE_HOURS

    if (cacheValido && caso.processLastSummary) {
      // Retorna do cache — sem chamar Datajud ou IA
      return NextResponse.json({
        summary: caso.processLastSummary,
        processNumber: caso.processNumber,
        lastMovDate: caso.processLastMovDate,
        lastMovCount: caso.processLastMovCount,
        lastCheck: caso.processLastCheck,
        fromCache: true,
      })
    }

    // ── Consultar Datajud ────────────────────────────────────
    let processoData
    try {
      processoData = await consultarProcesso(caso.processNumber)
    } catch (err) {
      // Fallback: se Datajud falhar, retorna cache mesmo expirado
      if (caso.processLastSummary) {
        return NextResponse.json({
          summary: caso.processLastSummary,
          processNumber: caso.processNumber,
          lastMovDate: caso.processLastMovDate,
          lastMovCount: caso.processLastMovCount,
          lastCheck: caso.processLastCheck,
          fromCache: true,
          cacheWarning: 'Não foi possível conectar ao Datajud. Exibindo última informação disponível.',
        })
      }
      return NextResponse.json(
        { error: `Erro ao consultar Datajud: ${String(err)}` },
        { status: 503 }
      )
    }

    // ── Verificar se houve atualização ──────────────────────
    const movDateChanged = caso.processLastMovDate?.toISOString() !== processoData.dataUltimaAtualizacao
    const movCountChanged = caso.processLastMovCount !== processoData.totalMovimentos
    const processoAtualizado = movDateChanged || movCountChanged

    // Se não houve mudança e tem cache, retorna cache (mesmo expirado)
    if (!processoAtualizado && caso.processLastSummary) {
      // Atualiza apenas o lastCheck sem chamar a IA
      await prisma.case.update({
        where: { id: params.id },
        data: { processLastCheck: agora }
      })

      return NextResponse.json({
        summary: caso.processLastSummary,
        processNumber: caso.processNumber,
        lastMovDate: caso.processLastMovDate,
        lastMovCount: caso.processLastMovCount,
        lastCheck: agora,
        fromCache: true,
        noChanges: true,
      })
    }

    // ── Gerar novo resumo com IA ─────────────────────────────
    const { summary, tokensUsed, costUsd } = await summarizeProcesso(
      processoData,
      caso.client.name ?? 'Cliente'
    )

    // Salvar no banco
    await prisma.case.update({
      where: { id: params.id },
      data: {
        processLastCheck:    agora,
        processLastMovDate:  new Date(processoData.dataUltimaAtualizacao),
        processLastMovCount: processoData.totalMovimentos,
        processLastSummary:  summary,
      }
    })

    return NextResponse.json({
      summary,
      processNumber: caso.processNumber,
      lastMovDate: new Date(processoData.dataUltimaAtualizacao),
      lastMovCount: processoData.totalMovimentos,
      lastCheck: agora,
      fromCache: false,
      tokensUsed,
      costUsd,
    })

  } catch (error) {
    console.error('[GET /api/cases/:id/process]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * PATCH /api/cases/:id/process
 * Salva ou atualiza o número CNJ do processo
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { processNumber } = body

    if (!processNumber || !isValidCNJ(processNumber)) {
      return NextResponse.json(
        { error: 'Número de processo inválido. Use o formato CNJ: 0001234-55.2024.4.03.6183' },
        { status: 422 }
      )
    }

    const caso = await prisma.case.findFirst({
      where: { id: params.id, userId: session.user.id },
      select: { id: true }
    })

    if (!caso) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    // Ao salvar novo número: limpar cache anterior
    await prisma.case.update({
      where: { id: params.id },
      data: {
        processNumber,
        processLastCheck:    null,
        processLastMovDate:  null,
        processLastMovCount: null,
        processLastSummary:  null,
      }
    })

    return NextResponse.json({ success: true, processNumber })

  } catch (error) {
    console.error('[PATCH /api/cases/:id/process]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

---

## Verificação de Plano — Atualização

```typescript
// services/billing/plan-guard.ts
// Adicionar 'USE_DATAJUD' ao tipo PlanFeature e ao switch

export type PlanFeature =
  | 'CREATE_CLIENT'
  | 'RUN_CALCULATION'
  | 'GENERATE_OPINION'
  | 'CREATE_NOTE'
  | 'GENERATE_DIAGNOSIS'
  | 'USE_SIMULATOR'
  | 'USE_RETROATIVOS'
  | 'EXPORT_PDF'
  | 'WHATSAPP_SHARE'
  | 'USE_DATAJUD'        // ← novo

// No switch:
case 'USE_DATAJUD':
  if (!limits.datajudEnabled) {
    throw new PlanLimitError(
      feature,
      'Consulta de processo disponível a partir do plano SOLO.',
      'SOLO'
    )
  }
  break
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

── PROCESSO (Datajud) ────────────────────────────────────────
GET   /api/cases/:id/process        Consulta Datajud (cache inteligente)
PATCH /api/cases/:id/process        Salva/atualiza número CNJ

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
