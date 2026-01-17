import type { AppError } from './types'

/**
 * Error handler result
 */
export interface ErrorHandlerResult {
  message: string
  code: string
  statusCode: number
  details?: Record<string, unknown>
  stack?: string
}

/**
 * Convert any error to a standardized error result
 */
export function handleError(error: unknown): ErrorHandlerResult {
  // Log the error for debugging
  console.error('Error occurred:', error)

  // If it's our custom AppError, use its properties
  if (error instanceof Error && 'code' in error && 'statusCode' in error) {
    const appError = error as AppError
    return {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      details: appError.details,
      stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined
    }
  }

  // For standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }

  // For unknown types (string, number, etc.)
  return {
    message: String(error),
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500
  }
}

/**
 * Format error for API responses
 */
export function formatErrorResponse(error: unknown) {
  const handled = handleError(error)
  return {
    error: {
      message: handled.message,
      code: handled.code,
      ...(handled.details && { details: handled.details })
    }
  }
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  const handled = handleError(error)

  const userMessages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    NOT_FOUND: 'The requested resource was not found.',
    AUTHENTICATION_ERROR: 'Please sign in to continue.',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
    API_ERROR: 'Something went wrong. Please try again.',
    DATABASE_ERROR: 'A database error occurred. Please try again.',
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again.'
  }

  return userMessages[handled.code] || userMessages.INTERNAL_SERVER_ERROR
}

/**
 * Safe async wrapper - converts thrown errors to AppErrorResult
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMapper?: (error: Error) => Error
): Promise<{ data: T | null; error: ErrorHandlerResult | null }> {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (err) {
    if (err instanceof Error && errorMapper) {
      const mappedError = errorMapper(err)
      return { data: null, error: handleError(mappedError) }
    }
    return { data: null, error: handleError(err) }
  }
}

/**
 * Execute an async function with error handling callback
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  onError?: (error: ErrorHandlerResult) => void
): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    const handled = handleError(err)
    onError?.(handled)
    return null
  }
}
