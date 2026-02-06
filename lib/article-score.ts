/**
 * Article Score Calculation (Content-First Version)
 * Calculates article score based on engagement metrics and content quality
 * Score range: 0-100
 *
 * Content-First: Prioritizes actual article content over Twitter metrics
 */

import { countWords } from './word-count'

/**
 * Calculate article score based on engagement metrics and content quality
 *
 * Metrics weighted as follows:
 * - Views: 25% - 100K+ views for good score, 1M+ for excellent (reduced from 35%)
 * - Likes: 20% - 1K+ likes for good score, 10K+ for excellent (reduced from 30%)
 * - Replies: 15% - 50+ replies for good score, 200+ for excellent (reduced from 20%)
 * - Content Quality: 35% - Word count + structure + completeness (increased from 15%)
 * - Bonus: +5 points for having both full content and summary
 *
 * @param article - Article data with metrics
 * @returns Score between 0 and 100
 */
export interface ArticleMetrics {
  tweet_views?: number
  tweet_likes?: number
  tweet_replies?: number
  full_article_content?: string
  has_summary?: boolean
}

export function calculateArticleScore(metrics: ArticleMetrics): number {
  const {
    tweet_views = 0,
    tweet_likes = 0,
    tweet_replies = 0,
    full_article_content = '',
    has_summary = false
  } = metrics

  // Calculate word count
  const wordCount = countWords(full_article_content)

  // Views score - 100K views = ~60 points, 1M views = ~90 points (weight reduced)
  const viewsScore = tweet_views > 0
    ? Math.min(Math.log10(tweet_views + 1) * 20, 100)
    : 0

  // Likes score - 1K likes = ~60 points, 10K likes = ~80 points (weight reduced)
  const likesScore = tweet_likes > 0
    ? Math.min(Math.log10(tweet_likes + 1) * 25, 100)
    : 0

  // Replies score - 50 replies = ~60 points, 200 replies = ~75 points (weight reduced)
  const repliesScore = tweet_replies > 0
    ? Math.min(Math.log10(tweet_replies + 1) * 30, 100)
    : 0

  // Content Quality Score - increased weight and improved calculation
  let contentScore: number
  if (wordCount < 100) {
    // Very short or no content
    contentScore = 0
  } else if (wordCount < 300) {
    // Short content - partial credit
    contentScore = ((wordCount - 100) / 200) * 30
  } else if (wordCount < 800) {
    // Medium content - good score
    contentScore = 30 + ((wordCount - 300) / 500) * 40
  } else if (wordCount < 2000) {
    // Long content - excellent score
    contentScore = 70 + ((wordCount - 800) / 1200) * 25
  } else {
    // Very long content - maximum score
    contentScore = 95 + Math.min((wordCount - 2000) / 1000 * 5, 5)
  }

  // Bonus for having both content and summary (indicates well-processed article)
  const completenessBonus = (wordCount >= 300 && has_summary) ? 5 : 0

  // Calculate weighted average with new weights (content-first)
  const totalScore = (
    viewsScore * 0.25 +
    likesScore * 0.20 +
    repliesScore * 0.15 +
    contentScore * 0.35 +
    completenessBonus
  )

  return Math.max(0, Math.min(100, Math.round(totalScore)))
}

/**
 * Determine if an article should be indexed based on its score
 */
export function shouldIndexArticle(score: number): boolean {
  return score >= 60 // Lowered from 65 to be more inclusive of quality content
}

/**
 * Check if article meets minimum word count requirement
 */
export function meetsMinimumWordCount(content: string): boolean {
  return countWords(content) >= 200
}

/**
 * Get score category for display
 */
export function getScoreCategory(score: number): {
  category: string
  color: string
} {
  if (score >= 90) return { category: 'Exceptional', color: 'text-purple-400' }
  if (score >= 80) return { category: 'Excellent', color: 'text-blue-400' }
  if (score >= 70) return { category: 'Great', color: 'text-green-400' }
  if (score >= 60) return { category: 'Good', color: 'text-yellow-400' }
  if (score >= 50) return { category: 'Fair', color: 'text-orange-400' }
  return { category: 'Poor', color: 'text-red-400' }
}
