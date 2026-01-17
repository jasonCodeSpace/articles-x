import { Buffer } from 'node:buffer'
import { timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto'

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Uses Node.js crypto.timingSafeEqual, with fallback to manual implementation.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  try {
    // Use Node.js crypto.timingSafeEqual
    const bufA = Buffer.from(a, 'utf-8')
    const bufB = Buffer.from(b, 'utf-8')
    return cryptoTimingSafeEqual(bufA, bufB)
  } catch {
    // Fallback: constant-time comparison using XOR
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}

/**
 * Verify Bearer token authorization with timing-safe comparison.
 */
export function verifyBearerToken(
  authHeader: string | null,
  expectedToken: string
): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  const providedToken = authHeader.slice(7)
  return timingSafeEqual(providedToken, expectedToken)
}
