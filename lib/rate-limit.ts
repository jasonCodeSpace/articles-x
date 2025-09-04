// Rate limiting utility for API endpoints
// In production, consider using Redis or a dedicated rate limiting service

interface RateLimitData {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Public endpoints (more restrictive)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 requests per minute
  },
  // Authenticated endpoints (less restrictive)
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  },
  // Heavy operations (very restrictive)
  heavy: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5 // 5 requests per minute
  }
} as const;

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitData>();

/**
 * Check if a client has exceeded the rate limit
 * @param clientId - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.public
): boolean {
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}:${config.maxRequests}`;
  const clientData = rateLimitStore.get(key);
  
  // If no data or window has expired, reset
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true;
  }
  
  // If limit exceeded
  if (clientData.count >= config.maxRequests) {
    return false;
  }
  
  // Increment count
  clientData.count++;
  return true;
}

/**
 * Get rate limit info for a client
 * @param clientId - Unique identifier for the client
 * @param config - Rate limit configuration
 * @returns Rate limit information
 */
export function getRateLimitInfo(
  clientId: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.public
): {
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}:${config.maxRequests}`;
  const clientData = rateLimitStore.get(key);
  
  if (!clientData || now > clientData.resetTime) {
    return {
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
      limit: config.maxRequests
    };
  }
  
  return {
    remaining: Math.max(0, config.maxRequests - clientData.count),
    resetTime: clientData.resetTime,
    limit: config.maxRequests
  };
}

/**
 * Extract client identifier from request
 * @param request - Next.js request object
 * @returns Client identifier (IP address or 'unknown')
 */
export function getClientId(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  return forwardedFor?.split(',')[0]?.trim() || 
         realIp || 
         cfConnectingIp || 
         'unknown';
}

/**
 * Clean up expired entries from the rate limit store
 * This should be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}