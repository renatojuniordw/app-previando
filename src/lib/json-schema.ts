import { z } from 'zod'

/**
 * Valida dados desconhecidos (ex.: JSON vindo do banco) contra um schema Zod.
 * Retorna o dado tipado ou lança um erro descritivo.
 *
 * @example
 *   const config = validateJsonSchema(rawJson, PortalConfigSchema)
 *   // config agora é PortalConfig (com type safety)
 */
export function validateJsonSchema<T>(data: unknown, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`JSON inválido no banco: ${issues}`)
  }
  return parsed.data
}

/**
 * Schema Zod para PortalConfig — corresponde a src/lib/portal-config.ts
 */
export const PortalConfigSchema = z.object({
  showCalculations: z.boolean(),
  showRetroactives: z.boolean(),
  showBpcSocialAnalysis: z.boolean(),
  showTimeline: z.boolean(),
  showDocuments: z.boolean(),
  showFaq: z.boolean(),
  showGlossary: z.boolean(),
  showPdfExport: z.boolean(),
  requireIdentity: z.boolean(),
})

export type PortalConfig = z.infer<typeof PortalConfigSchema>
