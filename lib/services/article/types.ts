import { z } from 'zod'

/**
 * Zod schema for harvested article fields
 */
export const HarvestedArticleSchema = z.object({
  article_url: z.string().url(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  author_handle: z.string().min(1),
  author_name: z.string().optional(),
  author_avatar: z.string().optional(),
  tweet_id: z.string(),
  rest_id: z.string().optional(),
  original_url: z.string().url().optional(),
  created_at: z.string(),
  featured_image_url: z.string().optional(),
  full_article_content: z.string().optional(),
  tweet_text: z.string().optional(),
  article_images: z.array(z.string()).optional(),
  article_videos: z.array(z.string()).optional(),
  metrics: z.object({
    views: z.number().int(),
    replies: z.number().int(),
    retweets: z.number().int(),
    likes: z.number().int(),
    bookmarks: z.number().int(),
  }).optional(),
})

export type HarvestedArticle = z.infer<typeof HarvestedArticleSchema>

/**
 * Tweet data for storage in tweets table
 */
export interface TweetData {
  tweet_id: string
  author_handle: string
  has_article: boolean
}

/**
 * Article data for storage in articles table
 */
export interface DatabaseArticle {
  id?: string // Optional for insert
  title: string
  slug: string
  full_article_content: string
  author_name: string
  author_handle?: string
  author_avatar?: string
  image?: string
  category?: string
  main_category?: string
  subcategory?: string
  tweet_published_at?: string
  tweet_id?: string
  tweet_text?: string
  tweet_views?: number
  tweet_replies?: number
  tweet_likes?: number
  article_published_at?: string
  article_url?: string
  article_images?: string[]
  article_videos?: string[]
  indexed?: boolean
  score?: number
}

/**
 * Statistics for ingest operations
 */
export interface IngestStats {
  inserted: number
  updated: number
  skipped: number
  lists: Array<{
    listId: string
    tweetsFound: number
    articlesHarvested: number
    errors: string[]
  }>
}

/**
 * Result of batch database operations
 */
export interface BatchResult {
  inserted: number
  updated: number
  skipped: number
  deleted: number
}
