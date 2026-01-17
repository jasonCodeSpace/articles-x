import type { ErrorHandlerResult } from './handler'

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Log entry
 */
interface LogEntry {
  level: LogLevel
  message: string
  code?: string
  statusCode?: number
  details?: Record<string, unknown>
  stack?: string
  timestamp: string
}

/**
 * Simple logger for client and server
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(entry: LogEntry): string {
    const { level, timestamp, message, ...rest } = entry
    const extras = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${extras}`
  }

  private log(entry: LogEntry) {
    const formatted = this.formatLog(entry)

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.INFO:
        console.log(formatted)
        break
      case LogLevel.DEBUG:
      default:
        if (this.isDevelopment) {
          console.log(formatted)
        }
        break
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }

    if (error instanceof Error) {
      entry.stack = error.stack
      if ('code' in error) entry.code = (error as { code?: string }).code
      if ('statusCode' in error) entry.statusCode = (error as { statusCode?: number }).statusCode
    }

    this.log(entry)
  }

  // Convenience method for logging handled errors
  logErrorHandled(handled: ErrorHandlerResult) {
    this.error(handled.message, { handled })
  }
}

// Export singleton instance
export const logger = new Logger()
