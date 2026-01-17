/**
 * Article Service Module
 *
 * Provides article-related operations:
 * - Mapping tweets to articles
 * - Content extraction
 * - Type definitions
 */

// Types
export type {
  HarvestedArticle,
  TweetData,
  DatabaseArticle,
  IngestStats,
  BatchResult,
} from './types'

export { HarvestedArticleSchema } from './types'

// Content extraction
export { extractFullArticleContent } from './extractor'

// Mapping functions
export {
  mapTweetToArticle,
  harvestedToDatabase,
  mapTweetToTweetData,
} from './mapper'

// Utils
export { parseTwitterDate, sleep } from '../utils/date'

// Batch operations
export { batchUpsertArticles } from './batch-ops'
