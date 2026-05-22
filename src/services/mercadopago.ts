import { MercadoPagoConfig, PreApproval } from 'mercadopago'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const mpPreApproval = new PreApproval(mp)

export const MP_PLAN_IDS: Record<string, string> = {
  SOLO: process.env.MP_PLAN_ID_SOLO!,
  PRO: process.env.MP_PLAN_ID_PRO!,
}

export const PLAN_PRICES: Record<string, number> = {
  SOLO: 299,
  PRO: 599,
}
