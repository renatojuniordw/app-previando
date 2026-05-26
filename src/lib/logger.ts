export class Logger {
  private context: string
  private isProduction = process.env.NODE_ENV === 'production'

  constructor(context: string) {
    this.context = context
  }

  private format(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, meta?: unknown) {
    const timestamp = new Date().toISOString()

    if (this.isProduction) {
      // JSON Estruturado para Produção
      const logObject: Record<string, unknown> = {
        timestamp,
        level,
        context: this.context,
        message,
      }

      if (meta !== undefined) {
        if (meta instanceof Error) {
          logObject.error = {
            name: meta.name,
            message: meta.message,
            stack: meta.stack,
          }
        } else if (typeof meta === 'object' && meta !== null) {
          logObject.metadata = meta
        } else {
          logObject.metadata = { value: meta }
        }
      }

      return JSON.stringify(logObject)
    } else {
      // Texto amigável colorido para Desenvolvimento Local
      const colors = {
        INFO: '\x1b[32m',  // Green
        WARN: '\x1b[33m',  // Yellow
        ERROR: '\x1b[31m', // Red
        DEBUG: '\x1b[36m', // Cyan
        reset: '\x1b[0m',
        gray: '\x1b[90m',
        red: '\x1b[31m',
      }

      const levelColor = colors[level] || ''
      const prefix = `${colors.gray}[${timestamp}]${colors.reset} ${levelColor}[${level}]${colors.reset} ${colors.gray}[${this.context}]${colors.reset}`

      let suffix = ''
      if (meta !== undefined) {
        if (meta instanceof Error) {
          suffix = `\n${colors.red}${meta.stack || meta.message}${colors.reset}`
        } else if (typeof meta === 'object' && meta !== null) {
          suffix = `\n${colors.gray}${JSON.stringify(meta, null, 2)}${colors.reset}`
        } else {
          suffix = ` ${meta}`
        }
      }

      return `${prefix} ${message}${suffix}`
    }
  }

  info(message: string, meta?: unknown) {
    console.log(this.format('INFO', message, meta))
  }

  warn(message: string, meta?: unknown) {
    console.warn(this.format('WARN', message, meta))
  }

  error(message: string, error?: unknown) {
    console.error(this.format('ERROR', message, error))
  }

  debug(message: string, meta?: unknown) {
    if (!this.isProduction) {
      console.log(this.format('DEBUG', message, meta))
    }
  }
}
