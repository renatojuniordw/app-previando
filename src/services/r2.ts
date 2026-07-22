import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME ?? 'previando-docs'

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

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(r2, command, { expiresIn: 900 }) // 15 minutos
}

export async function downloadPDF(key: string): Promise<Buffer> {
  const response = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export async function deletePDF(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function deleteObjectsByPrefix(prefix: string): Promise<void> {
  let continuationToken: string | undefined
  const deleteKeys: string[] = []

  do {
    try {
      const listed = await r2.send(
        new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: continuationToken })
      )

      for (const obj of listed.Contents ?? []) {
        if (obj.Key) deleteKeys.push(obj.Key)
      }

      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
    } catch (err) {
      console.error('[R2] Erro ao listar objetos:', err)
      throw err
    }
  } while (continuationToken)

  // R2 suporta delete em lote de até 1000 objetos por requisição
  while (deleteKeys.length > 0) {
    const batch = deleteKeys.splice(0, 1000)
    try {
      await Promise.all(batch.map((key) => r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))))
    } catch (err) {
      console.error('[R2] Erro ao deletar lote de objetos:', err)
      throw err
    }
  }
}

export async function uploadDocument(
  buffer: Buffer,
  userId: string,
  caseId: string,
  fileName: string,
  contentType: string = 'application/pdf'
): Promise<string> {
  const timestamp = Date.now()
  const normalizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `documents/${userId}/${caseId}/${timestamp}_${normalizedName}`

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return key
}

