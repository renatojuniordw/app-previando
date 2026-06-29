import { Logger } from '@/lib/logger'

const logger = new Logger('AssinaturaDigital')

const CLICKSIGN_API_URL = 'https://api.clicksign.com/api/v1'

function getApiKey(): string {
  const key = process.env.CLICKSIGN_API_KEY
  if (!key) throw new Error('CLICKSIGN_API_KEY não configurada.')
  return key
}

interface ClicksignSigner {
  name: string
  email: string
}

export interface AssinaturaInput {
  caseId: string
  tipoDocumento: string // PROCURACAO, PETICAO, CONTRATO
  documentBuffer: Buffer
  signers: Array<{ name: string; email: string }>
}

export interface AssinaturaResult {
  processoKey: string
  signUrl: string
}

export interface AssinaturaStatus {
  status: string // PENDING, SIGNED, CANCELLED, EXPIRED
  signers: Array<{ name: string; email: string; status: string }>
}

/**
 * Faz upload do documento e envia para assinatura no Clicksign.
 * Fluxo:
 *   1. Upload do documento binário → recebe document key
 *   2. Cria signatários → recebe signer keys
 *   3. Cria lista de assinatura vinculando documento + signatários → recebe list key e sign URL
 */
export async function enviarParaAssinatura(input: AssinaturaInput): Promise<AssinaturaResult> {
  const apiKey = getApiKey()

  // 1. Upload do documento
  const documentKey = await uploadDocument(input.documentBuffer, input.tipoDocumento)
  logger.info(`Documento enviado ao Clicksign: key=${documentKey}`)

  // 2. Criar signatários
  const signerKeys = await Promise.all(
    input.signers.map((s) => createSigner(s))
  )
  logger.info(`Signatários criados: ${signerKeys.join(', ')}`)

  // 3. Criar lista de assinatura
  const signerKeyList = signerKeys.map((key) => ({ key }))

  const listResponse = await fetch(
    `${CLICKSIGN_API_URL}/lists?access_token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        list: {
          document_key: documentKey,
          signer_keys: signerKeyList,
          signable_type: 'all',
          message: `Previando — Documento para assinatura: ${getDocumentoLabel(input.tipoDocumento)}`,
          skip_email: false,
          locale: 'pt-BR',
        },
      }),
    }
  )

  if (!listResponse.ok) {
    const errBody = await listResponse.text()
    logger.error('Falha ao criar lista de assinatura', errBody)
    throw new Error(`Erro ao criar lista de assinatura no Clicksign: ${listResponse.status}`)
  }

  const listData = await listResponse.json() as {
    list: { key: string; signers: Array<{ key: string; sign_url: string }> }
  }

  const processoKey = listData.list.key
  const signUrl = listData.list.signers[0]?.sign_url ?? ''

  return { processoKey, signUrl }
}

/**
 * Verifica o status da lista de assinatura no Clicksign.
 */
export async function verificarStatus(processoKey: string): Promise<AssinaturaStatus> {
  const apiKey = getApiKey()

  const response = await fetch(
    `${CLICKSIGN_API_URL}/lists/${processoKey}?access_token=${apiKey}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  )

  if (!response.ok) {
    throw new Error(`Erro ao consultar status: ${response.status}`)
  }

  const data = await response.json() as {
    list: {
      status: string
      signers: Array<{ name: string; email: string; status: string }>
    }
  }

  return {
    status: data.list.status,
    signers: data.list.signers.map((s) => ({
      name: s.name,
      email: s.email,
      status: s.status,
    })),
  }
}

/**
 * Baixa o documento assinado do Clicksign.
 */
export async function baixarDocumentoAssinado(processoKey: string): Promise<Buffer> {
  const apiKey = getApiKey()

  const response = await fetch(
    `${CLICKSIGN_API_URL}/lists/${processoKey}/signed_file?access_token=${apiKey}`,
    { method: 'GET' }
  )

  if (!response.ok) {
    throw new Error(`Erro ao baixar documento assinado: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function uploadDocument(buffer: Buffer, tipoDocumento: string): Promise<string> {
  const apiKey = getApiKey()

  const fileName = getDocumentoFileName(tipoDocumento)
  const blob = new Blob([buffer as BlobPart], { type: 'application/pdf' })
  const formData = new FormData()
  formData.append('document[path]', 'documento.pdf')
  formData.append('document[archive]', blob, fileName)

  const response = await fetch(
    `${CLICKSIGN_API_URL}/documents?access_token=${apiKey}`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const errBody = await response.text()
    logger.error('Falha ao fazer upload do documento', errBody)
    throw new Error(`Erro ao enviar documento para o Clicksign: ${response.status}`)
  }

  const data = await response.json() as { document: { key: string } }
  return data.document.key
}

async function createSigner(signer: ClicksignSigner): Promise<string> {
  const apiKey = getApiKey()

  const response = await fetch(
    `${CLICKSIGN_API_URL}/signers?access_token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signer: {
          name: signer.name,
          email: signer.email,
          auths: ['email'],
        },
      }),
    }
  )

  if (!response.ok) {
    const errBody = await response.text()
    logger.error('Falha ao criar signatário', errBody)
    throw new Error(`Erro ao criar signatário: ${response.status}`)
  }

  const data = await response.json() as { signer: { key: string } }
  return data.signer.key
}

function getDocumentoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    PROCURACAO: 'Procuração',
    PETICAO: 'Petição Inicial',
    CONTRATO: 'Contrato de Honorários',
  }
  return labels[tipo] ?? tipo
}

function getDocumentoFileName(tipo: string): string {
  const names: Record<string, string> = {
    PROCURACAO: 'procuracao.pdf',
    PETICAO: 'peticao-inicial.pdf',
    CONTRATO: 'contrato-honorarios.pdf',
  }
  return names[tipo] ?? 'documento.pdf'
}
