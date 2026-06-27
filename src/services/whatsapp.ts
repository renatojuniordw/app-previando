export interface WhatsAppMessage {
  to: string // Formato: 5511999999999
  text: string
}

export interface WhatsAppSendResult {
  success: boolean
  messageId?: string
  error?: string
}

async function sendViaZApi(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) throw new Error('ZAPI_INSTANCE_ID e ZAPI_TOKEN são obrigatórios')

  const res = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clientToken ? { 'Client-Token': clientToken } : {}),
      },
      body: JSON.stringify({ phone: msg.to, message: msg.text }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return { success: false, error: data?.error ?? `HTTP ${res.status}` }
  }

  return { success: true, messageId: data?.zaapId ?? data?.messageId }
}

async function sendViaMetaCloudApi(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN são obrigatórios')
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: msg.to,
        type: 'text',
        text: { body: msg.text },
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    const err = data?.error?.message ?? `HTTP ${res.status}`
    return { success: false, error: err }
  }

  return { success: true, messageId: data?.messages?.[0]?.id }
}

export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? 'zapi'

  try {
    if (provider === 'meta') return await sendViaMetaCloudApi(msg)
    return await sendViaZApi(msg)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    }
  }
}
