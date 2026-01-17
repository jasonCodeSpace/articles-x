import { NextResponse } from 'next/server'
import type { ErrorHandlerResult } from './handler'
import { handleError, formatErrorResponse } from './handler'

/**
 * Create a standardized error response for API routes
 */
export function errorResponse(
  error: unknown,
  status?: number
): Response {
  const handled = handleError(error)

  return NextResponse.json(
    {
      error: {
        message: handled.message,
        code: handled.code,
        ...(handled.details && { details: handled.details })
      }
    },
    { status: status || handled.statusCode }
  )
}

/**
 * Create a standardized success response for API routes
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, unknown>
): Response {
  return NextResponse.json(
    {
      data,
      ...(meta && { meta })
    },
    { status }
  )
}

/**
 * Helper for handling async API route errors
 */
export async function handleApiRoute<T>(
  fn: () => Promise<T>
): Promise<Response> {
  try {
    const data = await fn()
    return successResponse(data)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * Common error responses
 */
export const errorResponses = {
  badRequest: (message = 'Bad Request', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 400),

  unauthorized: (message = 'Unauthorized', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 401),

  forbidden: (message = 'Forbidden', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 403),

  notFound: (message = 'Not Found', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 404),

  conflict: (message = 'Conflict', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 409),

  unprocessableEntity: (message = 'Unprocessable Entity', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 422),

  tooManyRequests: (message = 'Too Many Requests', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 429),

  internalError: (message = 'Internal Server Error', details?: Record<string, unknown>) =>
    errorResponse(new Error(message), 500)
}
