import { NextResponse } from 'next/server'
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

export function extractApiError(err: unknown, fallback = 'Erro inesperado.'): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
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
