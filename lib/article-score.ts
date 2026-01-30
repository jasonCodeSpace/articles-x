/**
 * Article Score Calculation (Balanced Version)
 * Calculates article score based on engagement metrics and word count
 * Score range: 0-100
 *
 * Balanced: Only top-quality articles get indexed, but not impossible
 */

import { countWords } from './word-count'

/**
 * Calculate article score based on engagement metrics and word count
 *
 * Metrics weighted as follows:
 * - Views: 35% - 100K+ views for good score, 1M+ for excellent
 * - Likes: 30% - 1K+ likes for good score, 10K+ for excellent
 * - Replies: 20% - 50+ replies for good score, 200+ for excellent
 * - Word count: 15% - 500+ words for good score, 1500+ for excellent
 *
 * @param article - Article data with metrics
 * @returns Score between 0 and 100
 */
export interface ArticleMetrics {
  tweet_views?: number
  tweet_likes?: number
  tweet_replies?: number
  full_article_content?: string
}

export function calculateArticleScore(metrics: ArticleMetrics): number {
  const {
    tweet_views = 0,
    tweet_likes = 0,
    tweet_replies = 0,
    full_article_content = ''
  } = metrics

  // Calculate word count
  const wordCount = countWords(full_article_content)

  // Views score - 100K views = ~60 points, 1M views = ~90 points
  const viewsScore = tweet_views > 0
    ? Math.min(Math.log10(tweet_views + 1) * 20, 100)
    : 0

  // Likes score - 1K likes = ~60 points, 10K likes = ~80 points
  const likesScore = tweet_likes > 0
    ? Math.min(Math.log10(tweet_likes + 1) * 25, 100)
    : 0

  // Replies score - 50 replies = ~60 points, 200 replies = ~75 points
  const repliesScore = tweet_replies > 0
    ? Math.min(Math.log10(tweet_replies + 1) * 30, 100)
    : 0

  // Word count score - simplified
  let wordCountScore: number
  if (wordCount < 200) {
    wordCountScore = 0
  } else if (wordCount <= 500) {
    wordCountScore = ((wordCount - 200) / 300) * 40
  } else if (wordCount <= 1500) {
    wordCountScore = 40 + ((wordCount - 500) / 1000) * 40
  } else {
    wordCountScore = 80 + Math.min((wordCount - 1500) / 500 * 20, 20)
  }

  // Calculate weighted average
  const totalScore = (
    viewsScore * 0.35 +
    likesScore * 0.30 +
    repliesScore * 0.20 +
    wordCountScore * 0.15
  )

  return Math.max(0, Math.min(100, Math.round(totalScore)))
}

/**
 * Determine if an article should be indexed based on its score
 */
export function shouldIndexArticle(score: number): boolean {
  return score >= 65 // Threshold for dynamic daily adjustment
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
