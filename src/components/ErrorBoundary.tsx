'use client'

import { Component, ReactNode } from 'react'
import { captureException } from '@sentry/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack ?? '')
    captureException(error, { extra: { componentStack: errorInfo.componentStack } })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-sans text-sm font-medium text-red-800">
            Algo deu errado ao carregar este componente.
          </p>
          <p className="font-sans text-xs text-red-600 mt-1">
            {this.state.error?.message ?? 'Erro desconhecido'}
          </p>
          <button
            className="mt-3 font-sans text-xs text-red-700 underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
