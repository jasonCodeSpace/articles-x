import type { TwitterTweet } from '../twitter'
import type { HarvestedArticle, TweetData, DatabaseArticle } from './types'
import { HarvestedArticleSchema } from './types'
import { extractFullArticleContent, extractMediaUrls } from './extractor'
import { generateSlug, generateShortId } from '@/lib/url-utils'
import { randomUUID } from 'crypto'
import { parseTwitterDate } from '../utils/date'

/**
 * Map Twitter tweet to harvested article data
 */
export function mapTweetToArticle(tweet: TwitterTweet): HarvestedArticle | null {
  try {
    const articleResult = tweet.article_results?.result || tweet.article?.article_results?.result
    if (!articleResult) {
      return null
    }

    // Extract user info - support both legacy and v2 API formats
    const userResult = tweet.core?.user_results?.result
    const userLegacy = userResult?.legacy
    const userCore = userResult?.core
    const userFallback = tweet.legacy?.user

    const authorHandle = userLegacy?.screen_name || userCore?.screen_name || userFallback?.screen_name
    const authorProfileImage = userLegacy?.profile_image_url_https ||
                               userResult?.avatar?.image_url ||
                               userFallback?.profile_image_url_https
    const authorName = userLegacy?.name || userCore?.name || userFallback?.name || authorHandle

    // Extract tweet info
    const legacy = tweet.legacy
    const tweetId = legacy?.id_str || tweet.rest_id
    const createdAt = legacy?.created_at
    const tweetText = legacy?.full_text || legacy?.text || ''

    if (!authorHandle || !tweetId || !createdAt) {
      console.warn(`Tweet missing required data - handle: ${authorHandle}, id: ${tweetId}, createdAt: ${createdAt}`)
      return null
    }

    // Build article URL
    const articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`
    const restId = articleResult.rest_id

    // Extract title
    const title = articleResult.title || tweetText.slice(0, 100) || 'Untitled Article'

    // Extract excerpt
    const excerpt = articleResult.preview_text || articleResult.description || tweetText.slice(0, 200) || undefined

    // Extract cover image URL
    const featuredImageUrl = articleResult.cover_media?.media_info?.original_img_url

    // Extract full content
    const fullContent = extractFullArticleContent(articleResult as Record<string, unknown>) || excerpt || title

    // Extract media URLs (images and videos)
    const { images: articleImages, videos: articleVideos } = extractMediaUrls(articleResult as Record<string, unknown>)

    // Parse metrics that might be strings like "1.2k"
    const parseMetric = (val: string | number | undefined): number => {
      if (val === undefined || val === null) return 0
      if (typeof val === 'number') return val

      const v = val.toLowerCase().trim()
      if (v.endsWith('k')) {
        return Math.floor(parseFloat(v.slice(0, -1)) * 1000)
      }
      if (v.endsWith('m')) {
        return Math.floor(parseFloat(v.slice(0, -1)) * 1000000)
      }
      if (v.endsWith('b')) {
        return Math.floor(parseFloat(v.slice(0, -1)) * 1000000000)
      }
      return parseInt(v.replace(/,/g, ''), 10) || 0
    }

    // Extract metrics
    let views = 0
    if (tweet.views?.count) {
      views = parseMetric(tweet.views.count)
    }

    const replyCount = parseMetric(legacy?.reply_count)
    const retweetCount = parseMetric(legacy?.retweet_count)
    const favoriteCount = parseMetric(legacy?.favorite_count)
    const bookmarkCount = parseMetric(legacy?.bookmark_count)

    const harvestedArticle: HarvestedArticle = {
      article_url: articleUrl,
      title,
      excerpt,
      author_handle: authorHandle,
      author_name: authorName,
      author_avatar: authorProfileImage,
      tweet_id: tweetId,
      rest_id: restId,
      original_url: articleResult.url,
      created_at: createdAt,
      featured_image_url: featuredImageUrl,
      full_article_content: fullContent,
      tweet_text: tweetText,
      article_images: articleImages.length > 0 ? articleImages : undefined,
      article_videos: articleVideos.length > 0 ? articleVideos : undefined,
      metrics: {
        views: views,
        replies: replyCount,
        retweets: retweetCount,
        likes: favoriteCount,
        bookmarks: bookmarkCount
      }
    }

    // Validate the harvested data
    const parsed = HarvestedArticleSchema.safeParse(harvestedArticle)
    if (!parsed.success) {
      console.warn(`Failed to validate harvested article from tweet ${tweetId}:`, parsed.error)
      return null
    }

    return parsed.data
  } catch (error) {
    console.error('Error mapping tweet to article:', error)
    return null
  }
}

/**
 * Convert harvested article to database article format
 */
export function harvestedToDatabase(harvested: HarvestedArticle): DatabaseArticle {
  // Pre-generate UUID for the article
  const id = randomUUID()

  // Generate slug with shortId suffix for URL lookup
  const titleSlug = generateSlug(harvested.title, null, harvested.tweet_id)
  const shortId = generateShortId(id)
  const slug = `${titleSlug}--${shortId}`

  // Create content
  const content = harvested.full_article_content || harvested.excerpt || harvested.title

  // Parse Twitter date to ISO string
  const publishedAt = parseTwitterDate(harvested.created_at)

  const result: DatabaseArticle = {
    id,
    title: harvested.title,
    slug,
    full_article_content: content,
    author_name: harvested.author_name || harvested.author_handle,
    author_handle: harvested.author_handle,
    author_avatar: harvested.author_avatar || undefined,
    image: harvested.featured_image_url,
    tweet_published_at: publishedAt,
    tweet_id: harvested.tweet_id,
    tweet_text: harvested.tweet_text,
    tweet_views: harvested.metrics?.views || 0,
    tweet_replies: harvested.metrics?.replies || 0,
    tweet_likes: harvested.metrics?.likes || 0,
    article_published_at: publishedAt,
    article_url: harvested.article_url,
    article_images: harvested.article_images,
    article_videos: harvested.article_videos,
  }

  return result
}

/**
 * Convert Twitter tweet to TweetData format for storage in tweets table
 */
export function mapTweetToTweetData(tweet: TwitterTweet): TweetData {
  // Extract user info
  const userResult = tweet.core?.user_results?.result
  const userLegacy = userResult?.legacy
  const userCore = userResult?.core
  const userFromTweetLegacy = tweet.legacy?.user

  const authorHandle = userLegacy?.screen_name || userCore?.screen_name || userFromTweetLegacy?.screen_name || 'unknown'

  // Extract tweet info
  const tweetLegacy = tweet.legacy
  const tweetId = tweetLegacy?.id_str || tweet.rest_id || ''

  // Check if tweet has article data
  const articleResult = tweet.article_results?.result || tweet.article?.article_results?.result
  const isArticle = !!articleResult

  return {
    tweet_id: tweetId,
    author_handle: authorHandle,
    has_article: isArticle,
  }
}
