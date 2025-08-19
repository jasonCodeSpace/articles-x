import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { TwitterTweet } from '@/lib/twitter'

// Zod schema for harvested article fields
const HarvestedArticleSchema = z.object({
  article_url: z.string().url(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  author_name: z.string().min(1),
  author_handle: z.string().min(1),
  author_profile_image: z.string().optional(),
  tweet_id: z.string(),
  rest_id: z.string().optional(),
  original_url: z.string().url().optional(),
  created_at: z.string(), // Twitter's created_at format
  featured_image_url: z.string().optional(),
})

export type HarvestedArticle = z.infer<typeof HarvestedArticleSchema>

// Interface for tweet data to be stored in tweets table
export interface TweetData {
  tweet_id: string
  rest_id?: string
  author_handle: string
  author_name: string
  author_profile_image?: string
  tweet_text: string
  created_at_twitter: string
  has_article: boolean
  article_url?: string
  article_title?: string
  article_excerpt?: string
  article_featured_image?: string
  article_rest_id?: string
  list_id: string
  raw_data: Record<string, unknown> // Complete raw tweet data
}

export interface DatabaseArticle {
  title: string
  slug: string
  content: string
  excerpt?: string
  author_name: string
  author_handle?: string
  author_profile_image?: string
  status: 'draft' | 'published'
  published_at?: string
  meta_title?: string
  meta_description?: string
  featured_image_url?: string
  tags: string[]
  category?: string
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
    const authorName = userLegacy?.name || userFallback?.name || authorHandle || 'Unknown'
    const authorProfileImage = userLegacy?.profile_image_url_https || userFallback?.profile_image_url_https
    
    // Extract tweet info
    const tweetId = tweet.legacy?.id_str || tweet.rest_id
    const createdAt = tweet.legacy?.created_at
    const tweetText = tweet.legacy?.full_text || tweet.legacy?.text || ''
    
    if (!authorHandle || !tweetId || !createdAt) {
      console.warn(`Tweet missing required data - handle: ${authorHandle}, id: ${tweetId}, createdAt: ${createdAt}`)
      return null
    }

    // Build article URL using priority order
    let articleUrl: string
    const restId = articleResult.rest_id // Always extract rest_id if available

    if (articleResult.url) {
      // (a) Explicit URL if present
      articleUrl = articleResult.url
    } else if (articleResult.rest_id) {
      // (b) https://x.com/i/articles/{rest_id}
      articleUrl = `https://x.com/i/articles/${restId}`
    } else {
      // (c) Source post URL https://x.com/{author_handle}/status/{tweet_id}
      articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`
    }

    // Extract title and description (prefer preview_text over description)
    const title = articleResult.title || tweetText.slice(0, 100) || 'Untitled Article'
    const excerpt = articleResult.preview_text || articleResult.description || tweetText.slice(0, 200) || undefined
    
    // Extract cover image URL from cover_media.media_info.original_img_url
    const featuredImageUrl = articleResult.cover_media?.media_info?.original_img_url

    const harvestedArticle: HarvestedArticle = {
      article_url: articleUrl,
      title,
      excerpt,
      author_name: authorName,
      author_handle: authorHandle,
      author_profile_image: authorProfileImage,
      tweet_id: tweetId,
      rest_id: restId,
      original_url: articleResult.url,
      created_at: createdAt,
      featured_image_url: featuredImageUrl,
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
  // Generate slug from title
  const slug = generateSlug(harvested.title)
  
  // Use excerpt or create one from title
  const excerpt = harvested.excerpt || `Article by ${harvested.author_name}`
  
  // Create basic content
  const content = harvested.excerpt || harvested.title
  
  // Parse Twitter date to ISO string
  const publishedAt = parseTwitterDate(harvested.created_at)

  return {
    title: harvested.title,
    slug,
    content,
    excerpt,
    author_name: harvested.author_name,
    author_handle: harvested.author_handle,
    author_profile_image: harvested.author_profile_image || undefined,
    status: 'published' as const,
    published_at: publishedAt,
    meta_title: harvested.title,
    meta_description: excerpt,
    featured_image_url: harvested.featured_image_url,
    tags: ['twitter', 'imported'],
    category: 'twitter-import',
  }
}

/**
 * Convert Twitter tweet to TweetData format for storage in tweets table
 */
export function mapTweetToTweetData(tweet: TwitterTweet, listId: string): TweetData {
  // Extract user info from core.user_results.result.legacy (new API structure) or fallback to legacy.user (current structure)
  const userLegacy = tweet.core?.user_results?.result?.legacy
  const userFromTweetLegacy = tweet.legacy?.user
  
  const authorHandle = userLegacy?.screen_name || userFromTweetLegacy?.screen_name || 'unknown'
  const authorName = userLegacy?.name || userFromTweetLegacy?.name || authorHandle
  const authorProfileImage = userLegacy?.profile_image_url_https || userFromTweetLegacy?.profile_image_url_https
  
  // Extract tweet info from legacy object (current API structure)
  const tweetLegacy = tweet.legacy
  const tweetId = tweetLegacy?.id_str || tweet.rest_id || ''
  const createdAt = tweetLegacy?.created_at || ''
  const tweetText = tweetLegacy?.full_text || tweetLegacy?.text || ''
  
  // Check if tweet has article data
  const articleResult = tweet.article_results?.result || tweet.article?.article_results?.result
  const hasArticle = !!articleResult
  
  let articleData: Partial<TweetData> = {}
  
  if (hasArticle && articleResult) {
    // Extract article information
    const restId = articleResult.rest_id
    let articleUrl: string
    
    if (articleResult.url) {
      articleUrl = articleResult.url
    } else if (articleResult.rest_id) {
      articleUrl = `https://x.com/i/articles/${restId}`
    } else {
      articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`
    }
    
    articleData = {
      article_url: articleUrl,
      article_title: articleResult.title || tweetText.slice(0, 100) || 'Untitled Article',
      article_excerpt: articleResult.preview_text || articleResult.description || tweetText.slice(0, 200),
      article_featured_image: articleResult.cover_media?.media_info?.original_img_url,
      article_rest_id: restId,
    }
  }
  
  return {
    tweet_id: tweetId,
    rest_id: tweet.rest_id,
    author_handle: authorHandle,
    author_name: authorName,
    author_profile_image: authorProfileImage,
    tweet_text: tweetText,
    created_at_twitter: createdAt,
    has_article: hasArticle,
    list_id: listId,
    raw_data: tweet, // Store complete raw tweet data
    ...articleData,
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

  const supabase = await createClient()
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
        // Check if article already exists
        const { data: existingArticle, error: checkError } = await supabase
          .from('articles')
          .select('id, updated_at')
          .eq('slug', generateSlug(harvestedArticle.title))
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Error checking existing article ${articleUrl}:`, checkError)
          skipped++
          continue
        }

        const dbArticle = harvestedToDatabase(harvestedArticle)

        if (existingArticle) {
          // Update existing article
          const { error: updateError } = await supabase
            .from('articles')
            .update({
              title: dbArticle.title,
              content: dbArticle.content,
              excerpt: dbArticle.excerpt,
              author_name: dbArticle.author_name,
              meta_title: dbArticle.meta_title,
              meta_description: dbArticle.meta_description,
              featured_image_url: dbArticle.featured_image_url,
              tags: dbArticle.tags,
              category: dbArticle.category,
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
          // Insert new article
          const { error: insertError } = await supabase
            .from('articles')
            .insert([dbArticle])

          if (insertError) {
            console.error(`Error inserting article ${articleUrl}:`, insertError)
            skipped++
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

  const supabase = await createClient()
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
              author_name: tweetData.author_name,
              author_profile_image: tweetData.author_profile_image,
              tweet_text: tweetData.tweet_text,
              has_article: tweetData.has_article,
              article_url: tweetData.article_url,
              article_title: tweetData.article_title,
              article_excerpt: tweetData.article_excerpt,
              article_featured_image: tweetData.article_featured_image,
              article_rest_id: tweetData.article_rest_id,
              list_id: tweetData.list_id,
              raw_data: tweetData.raw_data,
              updated_at: new Date().toISOString(),
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
              rest_id: tweetData.rest_id,
              author_handle: tweetData.author_handle,
              author_name: tweetData.author_name,
              author_profile_image: tweetData.author_profile_image,
              tweet_text: tweetData.tweet_text,
              created_at_twitter: tweetData.created_at_twitter,
              has_article: tweetData.has_article,
              article_url: tweetData.article_url,
              article_title: tweetData.article_title,
              article_excerpt: tweetData.article_excerpt,
              article_featured_image: tweetData.article_featured_image,
              article_rest_id: tweetData.article_rest_id,
              list_id: tweetData.list_id,
              raw_data: tweetData.raw_data,
            })

          if (insertError) {
            console.error(`Error inserting tweet ${tweetData.tweet_id}:`, insertError)
            skipped++
          } else {
            inserted++
          }
        }
      } catch (error) {
        console.error(`Error processing tweet ${tweetData.tweet_id}:`, error)
        skipped++
      }
    }

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < tweetDataArray.length) {
      await sleep(100)
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

  const allHarvestedArticles: HarvestedArticle[] = []
  const allTweetData: TweetData[] = []

  // Process each list
  for (const [listId, tweets] of listTweets) {
    const listStats = {
      listId,
      tweetsFound: tweets.length,
      articlesHarvested: 0,
      errors: [] as string[],
    }

    try {
      // Process all tweets for storage in tweets table
      const tweetDataForList: TweetData[] = []
      
      for (const tweet of tweets) {
        try {
          // Convert tweet to TweetData for storage
          const tweetData = mapTweetToTweetData(tweet, listId)
          tweetDataForList.push(tweetData)
          
          // Also try to extract article if it exists
          const article = mapTweetToArticle(tweet)
          if (article) {
            allHarvestedArticles.push(article)
            listStats.articlesHarvested++
          }
        } catch (error) {
          const tweetId = tweet.legacy?.id_str || tweet.rest_id || 'unknown'
          const errorMsg = `Error processing tweet ${tweetId}: ${error}`
          console.error(errorMsg)
          listStats.errors.push(errorMsg)
        }
      }

      allTweetData.push(...tweetDataForList)

      console.log(`List ${listId}: Found ${tweets.length} tweets, harvested ${listStats.articlesHarvested} articles`)
      
    } catch (error) {
      const errorMsg = `Error processing list ${listId}: ${error}`
      console.error(errorMsg)
      listStats.errors.push(errorMsg)
    }

    stats.lists.push(listStats)
  }

  // First, batch upsert all tweets to tweets table
  if (allTweetData.length > 0) {
    try {
      console.log(`Saving ${allTweetData.length} tweets to database...`)
      const tweetStats = await batchUpsertTweets(allTweetData, dryRun)
      console.log(`Tweet storage complete: ${tweetStats.inserted} inserted, ${tweetStats.updated} updated, ${tweetStats.skipped} skipped`)
    } catch (error) {
      console.error('Error saving tweets to database:', error)
    }
  }

  // Then, batch upsert harvested articles to articles table
  if (allHarvestedArticles.length > 0) {
    const upsertStats = await batchUpsertArticles(allHarvestedArticles, dryRun)
    stats.inserted = upsertStats.inserted
    stats.updated = upsertStats.updated
    stats.skipped = upsertStats.skipped
  }

  return stats
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 100) // Limit length
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
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