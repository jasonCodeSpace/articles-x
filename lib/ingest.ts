import { z } from 'zod'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { TwitterTweet } from '@/lib/twitter'
import { generateSlug, generateShortId } from '@/lib/url-utils'
import fs from 'fs'
import path from 'path'

// Zod schema for harvested article fields
// Zod schema for harvested article fields
const HarvestedArticleSchema = z.object({
  article_url: z.string().url(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  author_handle: z.string().min(1),
  author_avatar: z.string().optional(),
  tweet_id: z.string(),
  rest_id: z.string().optional(),
  original_url: z.string().url().optional(),
  created_at: z.string(), // Twitter's created_at format
  featured_image_url: z.string().optional(),
  full_article_content: z.string().optional(),
  tweet_text: z.string().optional(),
  metrics: z.object({
    views: z.number().int(),
    replies: z.number().int(),
    retweets: z.number().int(),
    likes: z.number().int(),
    bookmarks: z.number().int(),
  }).optional(),
})

export type HarvestedArticle = z.infer<typeof HarvestedArticleSchema>

// Interface for tweet data to be stored in tweets table
export interface TweetData {
  tweet_id: string
  author_handle: string
  has_article: boolean
}

export interface DatabaseArticle {
  title: string
  slug: string
  full_article_content: string
  author_name: string
  author_handle?: string
  author_avatar?: string
  image?: string
  tag?: string[]
  category?: string
  tweet_published_at?: string
  tweet_id?: string
  tweet_text?: string
  tweet_views?: number
  tweet_replies?: number
  tweet_retweets?: number
  tweet_likes?: number
  article_published_at?: string
  article_url?: string
}

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
 * Map Twitter tweet to harvested article data
 */
export function mapTweetToArticle(tweet: TwitterTweet): HarvestedArticle | null {
  try {
    // Check for article data in multiple possible locations
    const articleResult = tweet.article_results?.result || tweet.article?.article_results?.result
    if (!articleResult) {
      return null
    }

    // Extract user info from core.user_results.result.legacy (new API structure) or fallback to legacy.user (old structure)
    const userLegacy = tweet.core?.user_results?.result?.legacy
    const userFallback = tweet.legacy?.user
    
    const authorHandle = userLegacy?.screen_name || userFallback?.screen_name
    const authorProfileImage = userLegacy?.profile_image_url_https || userFallback?.profile_image_url_https
    
    // Extract tweet info
    // Use legacy object for metrics if available
    const legacy = tweet.legacy;
    const tweetId = legacy?.id_str || tweet.rest_id
    const createdAt = legacy?.created_at
    const tweetText = legacy?.full_text || legacy?.text || ''
    
    if (!authorHandle || !tweetId || !createdAt) {
      console.warn(`Tweet missing required data - handle: ${authorHandle}, id: ${tweetId}, createdAt: ${createdAt}`)
      return null
    }

    // Build article URL: always use source post URL https://x.com/{author_handle}/status/{tweet_id}
    const articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`
    const restId = articleResult.rest_id // still capture rest_id for metadata if available

    // Extract title
    // Logic: Convert title to lowercase (handled in generateSlug but strict output requirement is for slug. Title itself can be original?). 
    // User schema says "title, title_english". "slug (Fix Immediate): ... Convert title to lowercase". 
    // This implies the SLUG derivation uses lowercase. The Title field itself usually retains casing for display, 
    // but the User Request for Slug says "Convert title to lowercase" as a step for Slug.
    // I will keep original title in `title` field, and strict slug logic handles the rest.
    const title = articleResult.title || tweetText.slice(0, 100) || 'Untitled Article'
    
    // article_preview_text is DELETED. We still capture excerpt for internal logic if needed, 
    // but user says "DELETE this field. It is redundant". 
    // I will map it to 'excerpt' content, but not save it to DB 'article_preview_text'.
    // Or simpler, just capture full content.
    const excerpt = articleResult.preview_text || articleResult.description || tweetText.slice(0, 200) || undefined
    
    // Extract cover image URL from cover_media.media_info.original_img_url
    const featuredImageUrl = articleResult.cover_media?.media_info?.original_img_url

    // Full Content from Deep Fetch
    // Access the 'content' field we added to schema
    // If deep fetch worked, 'content' should be populated in articleResult
    const fullContent = articleResult.content || excerpt || title;

    // Helper to parse metrics that might be strings like "1.2k"
    const parseMetric = (val: string | number | undefined): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      
      const v = val.toLowerCase().trim();
      if (v.endsWith('k')) {
        return Math.floor(parseFloat(v.slice(0, -1)) * 1000);
      }
      if (v.endsWith('m')) {
        return Math.floor(parseFloat(v.slice(0, -1)) * 1000000);
      }
      if (v.endsWith('b')) {
        return Math.floor(parseFloat(v.slice(0, -1)) * 1000000000);
      }
      return parseInt(v.replace(/,/g, ''), 10) || 0;
    };

    // Metrics
    // Capture from legacy object or views
    
    let views = 0;
    if (tweet.views?.count) {
        views = parseMetric(tweet.views.count);
    }
    
    const replyCount = parseMetric(legacy?.reply_count);
    const retweetCount = parseMetric(legacy?.retweet_count);
    const favoriteCount = parseMetric(legacy?.favorite_count);
    const bookmarkCount = parseMetric(legacy?.bookmark_count);

    const harvestedArticle: HarvestedArticle = {
      article_url: articleUrl,
      title,
      excerpt,
      author_handle: authorHandle,
      author_avatar: authorProfileImage,
      tweet_id: tweetId,
      rest_id: restId,
      original_url: articleResult.url,
      created_at: createdAt,
      featured_image_url: featuredImageUrl,
      full_article_content: fullContent,
      tweet_text: tweetText,
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

// Cache for author category mappings
let authorCategoryCache: Map<string, string> | null = null

/**
 * Load author category mappings from tags.csv
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function loadAuthorCategoryMappings(): Map<string, string> {
  if (authorCategoryCache) {
    return authorCategoryCache
  }

  const mappings = new Map<string, string>()
  
  try {
    const csvPath = path.join(process.cwd(), 'tags.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    const lines = csvContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      
      const colonIndex = trimmedLine.indexOf(':')
      if (colonIndex === -1) continue
      
      const authorHandle = trimmedLine.substring(0, colonIndex).trim()
      const categories = trimmedLine.substring(colonIndex + 1).trim()
      
      // Use the first category if multiple categories are specified
      const primaryCategory = categories.split(',')[0].trim()
      mappings.set(authorHandle, primaryCategory)
    }
    
    console.log(`Loaded ${mappings.size} author category mappings from tags.csv`)
  } catch (error) {
    console.warn('Failed to load author category mappings from tags.csv:', error)
  }
  
  authorCategoryCache = mappings
  return mappings
}

/**
 * Get category for author handle
 * Note: Disabled automatic category assignment to prevent unwanted updates
 */
function getCategoryForAuthor(): string | undefined {
  // Return undefined to prevent automatic category assignment
  return undefined
}

/**
 * Convert harvested article to database article format
 */
export function harvestedToDatabase(harvested: HarvestedArticle): DatabaseArticle {
  // Generate slug using new function with fallback for non-English titles
  // title_english is null at harvest time, will be updated after summary generation
  const slug = generateSlug(harvested.title, null, harvested.tweet_id)

  // Create basic content
  // Requirement: Extract the entire HTML/Text body... Do not truncate.
  const content = harvested.full_article_content || harvested.excerpt || harvested.title

  // Parse Twitter date to ISO string
  const publishedAt = parseTwitterDate(harvested.created_at)

  // Get category based on author handle (disabled to prevent automatic assignment)
  const category = getCategoryForAuthor()

  const result: DatabaseArticle = {
    title: harvested.title,
    slug,
    full_article_content: content,
    author_name: harvested.author_handle,
    author_handle: harvested.author_handle,
    author_avatar: harvested.author_avatar || undefined,
    image: harvested.featured_image_url,
    tag: ['twitter', 'imported'],
    tweet_published_at: publishedAt,
    tweet_id: harvested.tweet_id,
    tweet_text: harvested.tweet_text,
    tweet_views: harvested.metrics?.views,
    tweet_replies: harvested.metrics?.replies,
    tweet_retweets: harvested.metrics?.retweets,
    tweet_likes: harvested.metrics?.likes,
    article_published_at: publishedAt,
    article_url: harvested.article_url,
  }

  // Only set category if it's defined to prevent automatic assignment
  if (category !== undefined) {
    result.category = category
  }

  return result
}

/**
 * Convert Twitter tweet to TweetData format for storage in tweets table
 */
export function mapTweetToTweetData(tweet: TwitterTweet): TweetData {
  // Extract user info from core.user_results.result.legacy (new API structure) or fallback to legacy.user (current structure)
  const userLegacy = tweet.core?.user_results?.result?.legacy
  const userFromTweetLegacy = tweet.legacy?.user
  
  const authorHandle = userLegacy?.screen_name || userFromTweetLegacy?.screen_name || 'unknown'
  
  // Extract tweet info from legacy object (current API structure)
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

/**
 * Batch upsert articles to the database
 */
export async function batchUpsertArticles(
  harvestedArticles: HarvestedArticle[],
  dryRun = false
): Promise<{ inserted: number; updated: number; skipped: number }> {
  if (harvestedArticles.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0 }
  }

  const supabase = createServiceRoleClient()
  let inserted = 0
  let updated = 0
  let skipped = 0

  // Group by article_url to handle duplicates
  const uniqueArticles = new Map<string, HarvestedArticle>()
  for (const article of harvestedArticles) {
    uniqueArticles.set(article.article_url, article)
  }

  console.log(`Processing ${uniqueArticles.size} unique articles (${harvestedArticles.length} total harvested)`) 

  if (dryRun) {
    console.log('DRY RUN: Would process these articles:')
    for (const [url, article] of uniqueArticles) {
      console.log(`  - ${article.title} (${url})`)
    }
    return { inserted: uniqueArticles.size, updated: 0, skipped: 0 }
  }

  // Process articles in batches of 10 to avoid overwhelming the database
  const articleEntries = Array.from(uniqueArticles.entries())
  const batchSize = 10

  for (let i = 0; i < articleEntries.length; i += batchSize) {
    const batch = articleEntries.slice(i, i + batchSize)
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articleEntries.length / batchSize)}`)

    for (const [articleUrl, harvestedArticle] of batch) {
      try {
        const dbArticle = harvestedToDatabase(harvestedArticle)

        // First check if article already exists based on title and article_url
        const { data: existingArticle, error: checkError } = await supabase
          .from('articles')
          .select('id, updated_at')
          .eq('title', dbArticle.title)
          .eq('article_url', dbArticle.article_url || '')
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Error checking existing article ${articleUrl}:`, checkError)
          skipped++
          continue
        }

        if (existingArticle) {
          // Update existing article (exclude category to prevent overwriting)
          const { error: updateError } = await supabase
            .from('articles')
            .update({
              title: dbArticle.title,
              full_article_content: dbArticle.full_article_content,
              author_name: dbArticle.author_name,
              author_handle: dbArticle.author_handle,
              author_avatar: dbArticle.author_avatar,
              image: dbArticle.image,
              tag: dbArticle.tag,
              tweet_published_at: dbArticle.tweet_published_at,
              tweet_id: dbArticle.tweet_id,
              article_published_at: dbArticle.article_published_at,
              article_url: dbArticle.article_url,
            })
            .eq('id', existingArticle.id)

          if (updateError) {
            console.error(`Error updating article ${articleUrl}:`, updateError)
            skipped++
          } else {
            console.log(`Updated article: ${dbArticle.title}`)
            updated++
          }
        } else {
          // Insert new article - the unique constraint will prevent duplicates
          const { error: insertError } = await supabase
            .from('articles')
            .insert([dbArticle])

          if (insertError) {
            // Check if it's a duplicate constraint violation
            if (insertError.code === '23505' && insertError.message?.includes('articles_title_url_unique')) {
              console.log(`Skipped duplicate article: ${dbArticle.title}`)
              skipped++
            } else {
              console.error(`Error inserting article ${articleUrl}:`, insertError)
              skipped++
            }
          } else {
            console.log(`Inserted article: ${dbArticle.title}`)
            inserted++
          }
        }
      } catch (error) {
        console.error(`Unexpected error processing article ${articleUrl}:`, error)
        skipped++
      }
    }

    // Small delay between batches
    if (i + batchSize < articleEntries.length) {
      await sleep(1000)
    }
  }

  console.log(`Batch upsert completed: ${inserted} inserted, ${updated} updated, ${skipped} skipped`)
  return { inserted, updated, skipped }
}

/**
 * Batch upsert tweets to the database
 */
export async function batchUpsertTweets(
  tweetDataArray: TweetData[],
  dryRun = false
): Promise<{ inserted: number; updated: number; skipped: number }> {
  if (dryRun) {
    console.log(`[DRY RUN] Would process ${tweetDataArray.length} tweets`)
    return { inserted: 0, updated: 0, skipped: 0 }
  }

  const supabase = createServiceRoleClient()
  let inserted = 0
  let updated = 0
  let skipped = 0

  // Process tweets in batches of 50 to avoid overwhelming the database
  const batchSize = 50
  for (let i = 0; i < tweetDataArray.length; i += batchSize) {
    const batch = tweetDataArray.slice(i, i + batchSize)
    
    for (const tweetData of batch) {
      try {
        // Check if tweet already exists
        const { data: existingTweet, error: checkError } = await supabase
          .from('tweets')
          .select('tweet_id')
          .eq('tweet_id', tweetData.tweet_id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Error checking existing tweet ${tweetData.tweet_id}:`, checkError)
          skipped++
          continue
        }

        if (existingTweet) {
          // Update existing tweet
          const { error: updateError } = await supabase
            .from('tweets')
            .update({
              author_handle: tweetData.author_handle,
              has_article: tweetData.has_article,
            })
            .eq('tweet_id', tweetData.tweet_id)

          if (updateError) {
            console.error(`Error updating tweet ${tweetData.tweet_id}:`, updateError)
            skipped++
          } else {
            updated++
          }
        } else {
          // Insert new tweet
          const { error: insertError } = await supabase
            .from('tweets')
            .insert({
              tweet_id: tweetData.tweet_id,
              author_handle: tweetData.author_handle,
              has_article: tweetData.has_article,
            })

          if (insertError) {
            console.error(`Error inserting tweet ${tweetData.tweet_id}:`, insertError)
            skipped++
          } else {
            inserted++
          }
        }
      } catch (error) {
        console.error(`Unexpected error processing tweet ${tweetData.tweet_id}:`, error)
        skipped++
      }
    }
  }

  console.log(`Tweet batch processing complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`)
  return { inserted, updated, skipped }
}

/**
 * Process tweets from multiple lists and return ingest statistics
 */
export async function ingestTweetsFromLists(
  listTweets: Map<string, TwitterTweet[]>,
  dryRun = false
): Promise<IngestStats> {
  const stats: IngestStats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    lists: [],
  }

  const allTweetData: TweetData[] = []

  // Process each list
  for (const [listId, tweets] of listTweets) {
    const listStats = {
      listId,
      tweetsFound: tweets.length,
      articlesHarvested: 0, // Keep for compatibility, but will always be 0
      errors: [] as string[],
    }

    try {
      // Process all tweets for storage in tweets table only
      const tweetDataForList: TweetData[] = []
      
      for (const tweet of tweets) {
        try {
          // Convert tweet to TweetData for storage
          const tweetData = mapTweetToTweetData(tweet)
          tweetDataForList.push(tweetData)
        } catch (error) {
          const tweetId = tweet.legacy?.id_str || tweet.rest_id || 'unknown'
          const errorMsg = `Error processing tweet ${tweetId}: ${error}`
          console.error(errorMsg)
          listStats.errors.push(errorMsg)
        }
      }

      allTweetData.push(...tweetDataForList)

      console.log(`List ${listId}: Found ${tweets.length} tweets, saved ${tweetDataForList.length} tweet records`)
      
    } catch (error) {
      const errorMsg = `Error processing list ${listId}: ${error}`
      console.error(errorMsg)
      listStats.errors.push(errorMsg)
    }

    stats.lists.push(listStats)
  }

  // Batch upsert all tweets to tweets table
  if (allTweetData.length > 0) {
    try {
      console.log(`Saving ${allTweetData.length} tweets to database...`)
      const tweetStats = await batchUpsertTweets(allTweetData, dryRun)
      console.log(`Tweet storage complete: ${tweetStats.inserted} inserted, ${tweetStats.updated} updated, ${tweetStats.skipped} skipped`)
      
      // Update stats with tweet results
      stats.inserted = tweetStats.inserted
      stats.updated = tweetStats.updated
      stats.skipped = tweetStats.skipped
    } catch (error) {
      console.error('Error saving tweets to database:', error)
    }
  }

  return stats
}



/**
 * Parse Twitter date format to ISO string
 */
function parseTwitterDate(twitterDate: string): string {
  try {
    // Twitter dates are in format: "Wed Oct 05 21:25:35 +0000 2022"
    const date = new Date(twitterDate)
    return date.toISOString()
  } catch {
    console.warn(`Failed to parse Twitter date ${twitterDate}, using current time`)
    return new Date().toISOString()
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Service-role Supabase client for server-side writes (bypasses RLS)
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service role environment variables are not set. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.')
  }
  return createSupabaseClient(supabaseUrl, serviceKey)
}