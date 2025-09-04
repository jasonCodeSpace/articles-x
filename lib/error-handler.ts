// Unified error handling utility for API endpoints
// Provides consistent error responses and prevents information leakage

import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: string; // Only included in development
}

// Standard error codes and messages
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    statusCode: 401
  },
  FORBIDDEN: {
    code: 'FORBIDDEN', 
    message: 'Access denied',
    statusCode: 403
  },
  
  // Rate Limiting
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
    statusCode: 429
  },
  
  // Client Errors
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    message: 'Invalid request',
    statusCode: 400
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    statusCode: 400
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404
  },
  
  // Server Errors
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Service temporarily unavailable',
    statusCode: 500
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database connection failed',
    statusCode: 500
  },
  EXTERNAL_API_ERROR: {
    code: 'EXTERNAL_API_ERROR',
    message: 'External service unavailable',
    statusCode: 502
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    statusCode: 503
  },
  
  // Configuration Errors
  CONFIGURATION_ERROR: {
    code: 'CONFIGURATION_ERROR',
    message: 'Service configuration error',
    statusCode: 500
  }
} as const;

/**
 * Create a standardized error response
 * @param errorType - Error type from ERROR_CODES
 * @param customMessage - Optional custom message to override default
 * @param details - Additional details (only shown in development)
 * @returns NextResponse with standardized error format
 */
export function createErrorResponse(
  errorType: keyof typeof ERROR_CODES,
  customMessage?: string,
  details?: string
): NextResponse {
  const error = ERROR_CODES[errorType];
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: ApiError = {
    code: error.code,
    message: customMessage || error.message,
    statusCode: error.statusCode
  };
  
  // Only include details in development environment
  if (isDevelopment && details) {
    response.details = details;
  }
  
  return NextResponse.json(response, { status: error.statusCode });
}

/**
 * Handle and log errors consistently
 * @param error - The caught error
 * @param context - Context information for logging
 * @param errorType - Fallback error type if not determinable
 * @returns NextResponse with appropriate error
 */
export function handleApiError(
  error: unknown,
  context: string,
  errorType: keyof typeof ERROR_CODES = 'INTERNAL_ERROR'
): NextResponse {
  // Log the error for debugging
  console.error(`[${context}] Error:`, error);
  
  // Determine error type based on error properties
  let responseErrorType = errorType;
  let details: string | undefined;
  
  if (error instanceof Error) {
    details = error.message;
    
    // Map specific error types
    if (error.message.includes('database') || error.message.includes('supabase')) {
      responseErrorType = 'DATABASE_ERROR';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      responseErrorType = 'EXTERNAL_API_ERROR';
    } else if (error.message.includes('configuration') || error.message.includes('environment')) {
      responseErrorType = 'CONFIGURATION_ERROR';
    }
  }
  
  return createErrorResponse(responseErrorType, undefined, details);
}

/**
 * Validate required environment variables
 * @param variables - Object with variable names and their values
 * @throws Error if any required variable is missing
 */
export function validateEnvironmentVariables(variables: Record<string, string | undefined>): void {
  const missing = Object.entries(variables)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Sanitize error message to prevent information leakage
 * @param message - Original error message
 * @returns Sanitized message safe for client consumption
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove file paths
  message = message.replace(/\/[^\s]+\.(js|ts|tsx|jsx)/g, '[file]');
  
  // Remove stack traces
  message = message.split('\n')[0];
  
  // Remove sensitive patterns
  const sensitivePatterns = [
    /password[=:]\s*[^\s]+/gi,
    /token[=:]\s*[^\s]+/gi,
    /key[=:]\s*[^\s]+/gi,
    /secret[=:]\s*[^\s]+/gi,
    /api[_-]?key[=:]\s*[^\s]+/gi
  ];
  
  sensitivePatterns.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
  });
  
  return message;
}

/**
 * Create success response with consistent format
 * @param data - Response data
 * @param message - Optional success message
 * @returns NextResponse with success format
 */
export function createSuccessResponse(
  data: Record<string, unknown>,
  message?: string
): NextResponse {
  const response = {
    success: true,
    ...(message && { message }),
    ...data
  };
  
  return NextResponse.json(response);
}