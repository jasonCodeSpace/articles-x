/**
 * Custom error classes for different error types
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, details)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, details)
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    public originalError?: Error,
    details?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', 500, details)
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    public originalError?: Error,
    details?: Record<string, unknown>
  ) {
    super(message, 'DATABASE_ERROR', 500, details)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 429, details)
  }
}

/**
 * Error type guard
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
