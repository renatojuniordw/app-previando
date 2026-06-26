# 05 — STORAGE
> Cloudflare R2 + PostgreSQL + Processamento Híbrido de CNIS

---

## Onde fica cada coisa

| O que | Onde |
|---|---|
| PDF original do CNIS | Cloudflare R2 (`previando-docs` ou `R2_BUCKET_NAME`) |
| Markdown do CNIS processado | PostgreSQL — campo `markdownContent` (TEXT) no modelo `CnisDocument` |
| Dados estruturados extraídos | PostgreSQL — campo `extractedData` (JSONB) no modelo `CnisDocument` |
| PDFs gerados (relatórios) | Cloudflare R2 (`previando-docs` ou `R2_BUCKET_NAME`) |

---

## Cliente R2 (`src/services/r2.ts`)

O cliente R2 é configurado via variáveis de ambiente e usa o SDK AWS v3 (`@aws-sdk/client-s3`).

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Nome do bucket configurável via variável de ambiente
const BUCKET = process.env.R2_BUCKET_NAME ?? 'previando-docs'
```

### Funções exportadas

#### `uploadPDF(buffer, userId, caseId) → string`

Faz upload de um PDF para o R2 e retorna **apenas a chave (key)** como string.

```typescript
export async function uploadPDF(buffer: Buffer, userId: string, caseId: string): Promise<string> {
  const timestamp = Date.now()
  const key = `cnis/${userId}/${caseId}/${timestamp}.pdf`

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
  )

  return key
}
```

- **Key format:** `cnis/{userId}/{caseId}/{timestamp}.pdf`
- **Retorno:** string com a key (não retorna objeto)
- **ContentType:** sempre `application/pdf`

#### `downloadPDF(key) → Buffer`

Baixa um PDF do R2 usando **streaming assíncrono** (`for await`) para eficiência de memória.

```typescript
export async function downloadPDF(key: string): Promise<Buffer> {
  const response = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
```

- Usa `for await (const chunk of response.Body)` + `Buffer.concat`
- **Não usa** `transformToByteArray()` (padrão antigo)

#### `getSignedDownloadUrl(key) → string`

Gera uma URL assinada temporária com **15 minutos de expiração** (900 segundos).

```typescript
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(r2, command, { expiresIn: 900 }) // 15 minutos
}
```

- **Nunca** gera URLs públicas permanentes
- Usado na API `GET /api/cnis/[caseId]` para download do PDF original

#### `deletePDF(key) → void`

Remove um PDF do R2. Usado na exclusão em cascata do caso (`DELETE /api/cnis/[caseId]`).

```typescript
export async function deletePDF(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
```

---

## Fluxo de Upload de CNIS (`src/app/api/cnis/upload/route.ts`)

### Validações de upload

Antes de qualquer processamento, o arquivo passa por validações rigorosas via `validatePDFUpload()` (`src/lib/upload-validator.ts`):

| Validação | Detalhe |
|---|---|
| **MIME type** | Deve ser `application/pdf` |
| **Tamanho máximo** | 10 MB (`10 * 1024 * 1024` bytes) |
| **Magic bytes** | Os primeiros 5 bytes devem começar com `%PDF-` |
| **Extensão** | O nome do arquivo deve terminar com `.pdf` |

```typescript
// src/lib/upload-validator.ts
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function validatePDFUpload(buffer: Buffer, fileName: string, mimeType: string): Promise<void> {
  if (mimeType !== 'application/pdf') throw new Error('Apenas arquivos PDF são aceitos.')
  if (buffer.byteLength > MAX_SIZE_BYTES) throw new Error('Tamanho máximo permitido: 10MB.')
  const header = buffer.slice(0, 5).toString('ascii')
  if (!header.startsWith('%PDF-')) throw new Error('Arquivo não é um PDF válido.')
  if (!fileName.toLowerCase().endsWith('.pdf')) throw new Error('Extensão do arquivo deve ser .pdf.')
}
```

### Rate limiting

- **Limite:** 10 uploads por hora por usuário
- **Implementação:** `rateLimit(\`cnis-upload:${userId}\`, 10, 3600)`
- **Resposta:** HTTP 429 com mensagem "Limite de uploads atingido. Tente em 1 hora."

### Fluxo completo do upload

```
1. Autenticação (session)
2. Rate limit check (10/hora)
3. Receber FormData (file + caseId)
4. Verificar ownership do caso
5. Converter file → Buffer
6. validatePDFUpload() (MIME, tamanho, magic bytes, extensão)
7. uploadPDF() → R2 (retorna key)
8. Criar CnisDocument no DB (status: PENDING)
9. Enfileirar job no BullMQ (cnis-processing)
10. Retornar 201 Created
```

---

## Processamento Híbrido de CNIS (`src/jobs/cnis-worker.ts`)

O worker BullMQ (`cnis-processing`) implementa um **fluxo híbrido de extração** que prioriza velocidade e economia de tokens.

### Pipeline de extração

```
Upload → R2 → BullMQ job → pdf-parse (com fallback OCR) →
  1. parseCnisProgrammatically (regex determinístico)
  2. validateCnisProgrammaticResult (validação AI, gpt-4.1-nano)
  3. Se válido → usa resultado programático (instantâneo, zero tokens de parsing)
  4. Se inválido → parseCnisWithAI (parsing completo, gpt-4.1-mini)
  → Salvar no DB → Criar notificação
```

### Detalhamento do worker

```typescript
// src/jobs/cnis-worker.ts
export function createCnisWorker(redis: Redis): Worker {
  return new Worker(
    'cnis-processing',
    async (job) => {
      const { cnisDocumentId, r2Key, caseId } = job.data

      // 1. Validar documento e buscar dados do caso
      // 2. Atualizar status para PROCESSING
      // 3. Baixar PDF do R2
      // 4. Extrair texto com pdf-parse (fallback: Tesseract OCR)
      // 5. Extração híbrida (programática + validação AI)
      // 6. Salvar resultado no DB
      // 7. Criar notificação
    }
  )
}
```

#### Etapa 1: Extração de texto do PDF

```typescript
const buffer = await downloadPDF(r2Key)

const pdfParse = await import('pdf-parse')
let pdfText = ''
try {
  const parsed = await pdfParse.default(buffer, { max: 0 })
  pdfText = parsed.text
} catch {
  // pdf-parse falhou — tenta OCR
}

// Fallback: se texto extraído < 100 caracteres, usa Tesseract OCR
if (pdfText.trim().length < 100) {
  const Tesseract = await import('tesseract.js')
  const { data } = await Tesseract.recognize(buffer, 'por')
  pdfText = data.text
}

if (pdfText.trim().length < 100) {
  throw new Error('Não foi possível extrair texto do documento PDF.')
}
```

#### Etapa 2: Extração híbrida

```typescript
let markdown = ''
let extractedData: any = null
let tokens = 0
let isProgrammatic = false

try {
  // 2a. Tentar parser programático (regex determinístico)
  const progResult = parseCnisProgrammatically(pdfText)
  if (progResult) {
    // 2b. Validar resultado com AI (gpt-4.1-nano)
    const validation = await validateCnisProgrammaticResult(pdfText, {
      nit: progResult.extractedData.nit ?? null,
      nome: progResult.extractedData.nome ?? null,
      primeiraContribuicao: progResult.extractedData.primeiraContribuicao ?? null,
      ultimaContribuicao: progResult.extractedData.ultimaContribuicao ?? null,
    })

    if (validation.valid) {
      // Sucesso: resultado programático validado
      markdown = progResult.markdown
      extractedData = progResult.extractedData
      isProgrammatic = true
    } else {
      // Falha na validação: escalar para AI completo
    }
  }
} catch (progErr) {
  // Erro no parser programático: escalar para AI completo
}

// 2c. Se não obteve resultado programático válido, usar AI completo
if (!isProgrammatic) {
  const aiResult = await parseCnisWithAI(pdfText)
  markdown = aiResult.markdown
  extractedData = aiResult.extractedData
  tokens = aiResult.tokens
}
```

#### Etapa 3: Salvar resultado

```typescript
await prisma.cnisDocument.update({
  where: { id: cnisDocumentId },
  data: {
    markdownContent: markdown,
    extractedData: extractedData,
    processingStatus: 'COMPLETED',
    processingTokens: tokens,
    processingMethod: isProgrammatic ? 'programmatic' : 'ai',
  },
})
```

#### Etapa 4: Notificações

```typescript
// Sucesso
await prisma.notification.create({
  data: {
    userId: caseRecord.userId,
    type: 'CNIS_PROCESSED',
    message: isProgrammatic
      ? 'CNIS processado com sucesso (Instantâneo)'
      : 'CNIS processado com sucesso',
  },
})

// Falha (no catch)
await prisma.notification.create({
  data: {
    userId: caseRecord.userId,
    type: 'CNIS_FAILED',
    message: `Erro ao processar CNIS: ${err.message}`,
  },
})
```

---

## Status de Processamento

O campo `processingStatus` do modelo `CnisDocument` segue esta máquina de estados:

```
PENDING → PROCESSING → SUMMARY_READY → PROCESSING_DETAILS → COMPLETED
```

Ou em caso de falha:

```
PENDING → PROCESSING → FAILED
```

### Definição dos status (`src/app/(dashboard)/cases/[id]/cnis/_constants.ts`)

```typescript
export const STATUS_CONFIG: Record<string, { label: string; color: 'slate' | 'yellow' | 'lime' | 'red' | 'blue' }> = {
  PENDING:             { label: 'Aguardando',         color: 'slate' },
  PROCESSING:          { label: 'Processando resumo...', color: 'yellow' },
  SUMMARY_READY:       { label: 'Resumo pronto',       color: 'blue' },
  PROCESSING_DETAILS:  { label: 'Processando salários...', color: 'yellow' },
  COMPLETED:           { label: 'Concluído',           color: 'lime' },
  FAILED:              { label: 'Falhou',              color: 'red' },
}

export const PROCESSING_STATUSES = ['PENDING', 'PROCESSING', 'SUMMARY_READY', 'PROCESSING_DETAILS'] as const
```

### Transições de status

| De → Para | Quando |
|---|---|
| `PENDING` → `PROCESSING` | Worker inicia o processamento |
| `PROCESSING` → `SUMMARY_READY` | Resumo (markdown) gerado |
| `SUMMARY_READY` → `PROCESSING_DETAILS` | Extração de detalhes (salários) iniciada |
| `PROCESSING_DETAILS` → `COMPLETED` | Extração completa finalizada |
| Qualquer → `FAILED` | Erro durante qualquer etapa |

### Reprocessamento

A rota `POST /api/cnis/[caseId]/reprocess` permite reprocessar um CNIS:

1. Reseta o status para `PENDING`
2. Limpa `processingError`, `markdownContent` e `extractedData`
3. Re-enfileira o job no BullMQ com 3 tentativas e backoff exponencial

---

## Métodos de Extração

### Parser Programático (`src/services/cnis/programmatic-parser.ts`)

- **Tecnologia:** Regex determinístico
- **Custo:** Zero tokens de AI
- **Velocidade:** Instantâneo
- **Extração:** NIT, nome, data de nascimento, competências, salários, períodos
- **Retorna:** `{ markdown, extractedData }` ou `null` se não conseguir extrair

### Validação AI (`src/services/cnis/ai-parser.ts`)

- **Modelo:** `gpt-4.1-nano` (`AI_MODELS.OPERATIONAL`)
- **Função:** Verifica se os campos NIT, nome, primeira e última contribuição do parser programático batem com o texto do CNIS
- **Retorna:** `{ valid: boolean, reason?: string }`
- **Custo:** ~100 tokens por validação

### Parser AI Completo (`src/services/cnis/ai-parser.ts`)

- **Modelo:** `gpt-4.1-mini` (`AI_MODELS.CRITICAL`)
- **Função:** Extração completa de todos os dados do CNIS via LLM
- **max_tokens:** 16.384 (`AI_MAX_TOKENS`)
- **timeout:** 180 segundos
- **Retorna:** `{ markdown, extractedData, tokens }`

---

## Modelos AI (`src/lib/ai-models.ts`)

```typescript
const AI_MODELS_MAP = {
  CRITICAL: 'gpt-4.1-mini',    // Tarefas jurídicas e extração previdenciária
  OPERATIONAL: 'gpt-4.1-nano', // Tarefas simples de texto (validação, classificação)
}
```

| Uso | Modelo | Custo estimado/token |
|---|---|---|
| Validação programática | `gpt-4.1-nano` | ~$0.00000020 |
| Parsing completo do CNIS | `gpt-4.1-mini` | ~$0.00000080 |
| Geração de pareceres | `gpt-4.1-mini` | ~$0.00000080 |

---

## APIs de CNIS

### Upload — `POST /api/cnis/upload`

- **Body:** FormData (`file` + `caseId`)
- **Validações:** Autenticação, rate limit, ownership, PDF validation
- **Retorno:** 201 Created com ID do documento

### Download — `GET /api/cnis/[caseId]`

- Retorna o documento com URL assinada para download (se status `COMPLETED` ou `SUMMARY_READY`)
- URL expira em 15 minutos

### Exclusão — `DELETE /api/cnis/[caseId]`

- Deleta o PDF do R2 (`deletePDF`)
- Exclui em cascata: cálculos, simulações, retroativos, pareceres, checklists, documento CNIS

### Atualização — `PUT /api/cnis/[caseId]`

- Permite atualizar `extractedData` manualmente
- Recalcula `nit`, `totalContributions`, `firstContribution`, `lastContribution`

### Status — `GET /api/cnis/[caseId]/status`

- Retorna apenas o `processingStatus` do documento

### Reprocessar — `POST /api/cnis/[caseId]/reprocess`

- Reseta para `PENDING` e re-enfileira no BullMQ
- 3 tentativas com backoff exponencial

---

## BullMQ — Fila de Processamento

- **Fila:** `cnis-processing`
- **Job type:** `process-cnis`
- **Payload:** `{ cnisDocumentId, r2Key, caseId }`
- **Tentativas:** 3 (no reprocessamento)
- **Backoff:** Exponencial (delay: 10s, 100s, 1000s)
- **Worker:** `createCnisWorker(redis)` — processa um job por vez

---

## Observações

- **Bucket configurável:** O nome do bucket R2 pode ser sobrescrito via `R2_BUCKET_NAME` (default: `previando-docs`)
- **Streaming:** O download usa `for await` + `Buffer.concat` para eficiência de memória
- **Zero URLs públicas:** Todos os acessos a PDFs usam URLs assinadas de 15 minutos
- **Fallback OCR:** Se `pdf-parse` extrai menos de 100 caracteres, o Tesseract OCR é acionado automaticamente
- **Economia de tokens:** O fluxo híbrido evita chamadas ao modelo `gpt-4.1-mini` quando o parser programático + validação são suficientes
- **Notificação "Instantâneo":** Quando o parser programático é validado com sucesso, a notificação inclui "(Instantâneo)" para indicar ao usuário que o processamento foi rápido e sem custo de tokens
