import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { Logger } from './logger'

const logger = new Logger('APIError')

export class NotFoundError extends Error {
  constructor(message = 'Recurso não encontrado.') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Acesso negado.') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends Error {
  constructor(message = 'Dados inválidos.') {
    super(message)
    this.name = 'ValidationError'
  }
}

export class PlanLimitError extends Error {
  feature: string
  upgradeRequired: string

  constructor(message: string, feature: string, upgradeRequired: string) {
    super(message)
    this.name = 'PlanLimitError'
    this.feature = feature
    this.upgradeRequired = upgradeRequired
  }
}

/**
 * Tipo para handler de API route que recebe req + params e retorna NextResponse
 */
type ApiHandler<T = Record<string, string>> = (
  req: NextRequest,
  params: T
) => Promise<NextResponse>

/**
 * Higher-Order Function que elimina o boilerplate try/catch nas rotas.
 * Exemplo de uso:
 *
 *   export const GET = withErrorHandler(async (req, params: { id: string }) => {
 *     // ... lógica sem try/catch
 *   })
 */
export function withErrorHandler<T = Record<string, string>>(
  handler: ApiHandler<T>
): ApiHandler<T> {
  return async (req: NextRequest, params: T) => {
    try {
      return await handler(req, params)
    } catch (err) {
      return handleApiError(err)
    }
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (error instanceof PlanLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        feature: error.feature,
        upgradeRequired: error.upgradeRequired,
      },
      { status: 402 }
    )
  }
  logger.error('Unhandled API exception', error)
  return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
}
