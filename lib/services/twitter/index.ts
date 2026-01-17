/**
 * Twitter Service Module
 *
 * Provides a clean interface for interacting with the Twitter API.
 * Separates concerns into:
 * - types: Zod schemas and TypeScript types
 * - client: HTTP client with retry logic
 * - parser: Response parsing utilities
 * - rate-limiter: Request rate limiting
 *
 * @example
 * import { createTwitterClient } from '@/lib/services/twitter'
 *
 * const client = createTwitterClient()
 * const tweets = await client.fetchAllListPages(listId)
 */

// Types
export type { TwitterTimelineResponse, TwitterTweet } from './types'
export { TweetSchema, TimelineResponseSchema } from './types'

// Client
export {
  TwitterClient,
  createTwitterClient,
  type TwitterClientConfig,
  type FetchListTimelineOptions,
  type TwitterApiError,
} from './client'

// Parser utilities
export {
  extractTweetsFromResponse,
  extractNextCursor,
  parseTweetFromDetail,
} from './parser'

// Rate limiter
export { RateLimiter } from './rate-limiter'
