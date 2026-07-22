import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getPortalAccess } from '@/lib/portal-access'
import type { PortalConfig } from '@/lib/portal-config'
import { PORTAL_SESSION_COOKIE, isPortalSessionValid } from '@/lib/portal-session'

/**
 * GET /api/portal/[token]
 * Endpoint público — sem autenticação.
 * Retorna dados do caso para exibição no Portal do Cliente.
 * Respeita portalConfig — só expõe o que o advogado autorizou.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const access = await getPortalAccess(params.token)
    if (!access) {
      return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 })
    }

    const { case: c } = access
    const hasWatermark = c.user.plan === 'FREE'

    // Lê a config do portal
    const portalConfig = (c.portalConfig ?? {
      showCalculations: true,
      showRetroactives: false,
      showBpcSocialAnalysis: false,
      requireIdentity: false,
    }) as unknown as PortalConfig

    // Se o advogado exigiu verificação de identidade, só libera os campos
    // sensíveis (cálculos/retroativos) com o cookie de sessão do portal válido.
    const verifiedCookie = req.cookies.get(PORTAL_SESSION_COOKIE)?.value
    const identityVerified =
      !portalConfig.requireIdentity || isPortalSessionValid(verifiedCookie, params.token)

    return NextResponse.json({
      hasWatermark,
      portalConfig,
      requiresVerification: portalConfig.requireIdentity && !identityVerified,
      lawyer: { name: c.user.name, oabNumber: c.user.oabNumber },
      client: { name: c.client.name, birthDate: c.client.birthDate },
      case: {
        id: c.id,
        status: c.status,
        benefitType: c.benefitType,
        createdAt: c.createdAt,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(portalConfig.showCalculations && identityVerified && { calculations: (access as any).case.calculations }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(portalConfig.showRetroactives && identityVerified && { retroactives: (access as any).case.retroactives }),
      expiresAt: access.expiresAt,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
