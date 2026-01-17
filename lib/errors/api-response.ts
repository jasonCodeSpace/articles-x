import { NextResponse } from 'next/server'
import { handleError } from './handler'

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
  badRequest: (message = 'Bad Request') =>
    errorResponse(new Error(message), 400),

  unauthorized: (message = 'Unauthorized') =>
    errorResponse(new Error(message), 401),

  forbidden: (message = 'Forbidden') =>
    errorResponse(new Error(message), 403),

  notFound: (message = 'Not Found') =>
    errorResponse(new Error(message), 404),

  conflict: (message = 'Conflict') =>
    errorResponse(new Error(message), 409),

  unprocessableEntity: (message = 'Unprocessable Entity') =>
    errorResponse(new Error(message), 422),

  tooManyRequests: (message = 'Too Many Requests') =>
    errorResponse(new Error(message), 429),

  internalError: (message = 'Internal Server Error') =>
    errorResponse(new Error(message), 500)
}
