# 05 — STORAGE
> Cloudflare R2 (bucket: previando-docs) + Processamento CNIS

---

## Onde fica cada coisa

| O que | Onde |
|---|---|
| PDF original do CNIS | Cloudflare R2 (previando-docs) |
| Markdown CNIS processado | PostgreSQL campo TEXT |
| Dados estruturados extraídos | PostgreSQL JSONB |
| PDFs gerados (relatórios) | Cloudflare R2 (previando-docs) |

---

## Cliente R2

```typescript
// lib/r2.ts
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

const BUCKET = 'previando-docs'

export async function uploadPDF(buffer: Buffer, userId: string, caseId: string) {
  const key = `cnis/${userId}/${caseId}/${Date.now()}.pdf`
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buffer,
    ContentType: 'application/pdf',
    Metadata: { userId, caseId, uploadedAt: new Date().toISOString() },
  }))
  return { key }
}

// URL temporária de 15 minutos — nunca URL pública permanente
export async function getSignedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 900 })
}

export async function deletePDF(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function downloadPDF(key: string): Promise<Buffer> {
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  return Buffer.from(await res.Body!.transformToByteArray())
}
```

---

## Fluxo de Upload

```
[Frontend] valida MIME + tamanho
    ↓
[POST /api/cnis/upload]
    Auth + rate limit → valida magic bytes → upload R2
    → cria CnisDocument (PENDING) → enfileira job BullMQ
    → retorna { caseId, status: 'PROCESSING' }
    ↓
[Frontend polling] GET /api/cnis/:caseId/status a cada 3s
    ↓
[BullMQ worker - process-cnis.ts]
    download R2 → extractTextFromPDF → parseCnisWithAI
    → generateCnisMarkdown → salva banco (COMPLETED)
    ↓
[Frontend detecta COMPLETED → exibe resumo → libera calculadora]
```

---

## Limites

| Operação | Limite |
|---|---|
| Tamanho máximo PDF | 10MB |
| Páginas processadas | 50 |
| Uploads/hora por usuário | 10 |
| Markdown enviado pra IA | 8.000 chars |
| Retenção PDFs | 90 dias após finalização |
| Bucket | previando-docs |
