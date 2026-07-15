# 05 — STORAGE
> Cloudflare R2 + PostgreSQL + Processamento Híbrido de CNIS
> Última atualização: 2026-07-15

---

## Onde fica cada coisa

| O que | Onde |
|---|---|
| PDF original do CNIS | Cloudflare R2 (`R2_BUCKET_NAME`, default `previando-docs`) |
| Markdown do CNIS processado | PostgreSQL — campo `markdownContent` (TEXT) |
| Dados estruturados extraídos | PostgreSQL — campo `extractedData` (JSONB) |
| Documentos de caso | Cloudflare R2 (`documents/{userId}/{caseId}/`) |

---

## Cliente R2 (`src/services/r2.ts`)

```typescript
// SDK AWS v3 (S3Client)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { ... },
})
const BUCKET = process.env.R2_BUCKET_NAME ?? 'previando-docs'
```

### Funções exportadas

- **`uploadPDF(buffer, userId, caseId) → key`** — key: `cnis/{userId}/{caseId}/{timestamp}.pdf`
- **`uploadDocument(buffer, userId, caseId, fileName, contentType) → key`** — key: `documents/{userId}/{caseId}/{timestamp}_{fileName}`
- **`downloadPDF(key) → Buffer`** — streaming async iterable
- **`getSignedDownloadUrl(key) → string`** — expira em 15 min (900s)
- **`deletePDF(key) → void`**

### Detalhes de implementação
- Streaming com `for await (const chunk of response.Body)` + `Buffer.concat`
- URLs assinadas de 15 minutos — zero URLs públicas
- `uploadDocument` adiciona timestamp e normaliza nome do arquivo

---

## Fluxo de Upload de CNIS

### Validações (4 camadas)
| Validação | Detalhe |
|---|---|
| MIME type | `application/pdf` |
| Tamanho máximo | 10 MB |
| Magic bytes | `%PDF-` |
| Extensão | `.pdf` |

### Rate limiting
- 10 uploads/hora por usuário
- Sliding window via Redis

### Fluxo completo
```
1. Auth → 2. Rate limit → 3. FormData (file + caseId) → 4. Ownership → 5. Buffer
→ 6. validatePDFUpload() → 7. uploadPDF() → R2 → 8. CnisDocument (PENDING)
→ 9. BullMQ job (cnis-processing) → 10. 201 Created
```

---

## Processamento Híbrido de CNIS

### Pipeline de extração
```
Upload → R2 → BullMQ → pdf-parse (fallback OCR)
  → 1. parseCnisProgrammatically (regex)
  → 2. validateCnisProgrammaticResult (gpt-4.1-nano)
  → 3. Se válido → resultado programático (instantâneo)
  → 4. Se inválido → parseCnisWithAI (gpt-4.1-mini)
  → Salvar DB → Notificação → Audit log
```

### Status de Processamento
```
PENDING → PROCESSING → SUMMARY_READY → PROCESSING_DETAILS → COMPLETED
                                                          → FAILED
```

### Worker
- **Fila:** `cnis-processing`
- **Concurrency:** 2
- **Rate Limiter:** 5 jobs/60s
- **OCR Fallback:** pdf-parse < 100 chars → Tesseract.js (por)
- **Notificações:** `CNIS_PROCESSED` / `CNIS_FAILED` + audit log
- **Backoff:** 3 tentativas (se reprocessamento)

---

## APIs de CNIS

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/cnis/upload` | Upload (rate limit 10/h) |
| GET | `/api/cnis/[caseId]` | Detalhe + URL assinada |
| DELETE | `/api/cnis/[caseId]` | Exclusão em cascata |
| PUT | `/api/cnis/[caseId]` | Atualiza extractedData |
| GET | `/api/cnis/[caseId]/status` | Status do processamento |
| POST | `/api/cnis/[caseId]/reprocess` | Reprocessa (3 tentativas) |

---

## Variáveis de Ambiente

```env
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="previando-docs"
```

---

## Observações

- Bucket configurável via `R2_BUCKET_NAME` (default: `previando-docs`)
- Streaming para eficiência de memória
- Zero URLs públicas — URLs assinadas de 15 minutos
- Fallback OCR automático
- Fluxo híbrido economiza tokens de IA
- Notificação inclui "(Instantâneo)" quando parser programático é usado
