/**
 * Centralized Error Handling Module
 *
 * Provides consistent error handling across the application
 */

// Error classes
export {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ApiError,
  DatabaseError,
  RateLimitError,
  isAppError
} from './types'

// Error handler utilities
export {
  handleError,
  formatErrorResponse,
  getUserMessage,
  safeAsync,
  tryCatch,
  type ErrorHandlerResult
} from './handler'

// Logger
export { logger, LogLevel } from './logger'

// API response helpers
export {
  errorResponse,
  successResponse,
  handleApiRoute,
  errorResponses
} from './api-response'
