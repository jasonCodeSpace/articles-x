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
  tweet_id: z.string(),
  rest_id: z.string().optional(),
  original_url: z.string().url().optional(),
  created_at: z.string(), // Twitter's created_at format
})

export type HarvestedArticle = z.infer<typeof HarvestedArticleSchema>

// Article database schema for upsert
const _DatabaseArticleSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  author_name: z.string(),
  status: z.enum(['draft', 'published']),
  published_at: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  featured_image_url: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
})

export type DatabaseArticle = z.infer<typeof _DatabaseArticleSchema>

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
    // Must have article_results to be considered an article
    const articleResult = tweet.article_results?.result
    if (!articleResult) {
      return null
    }

    // Extract basic info
    const tweetId = tweet.id_str
    const authorHandle = tweet.user?.screen_name
    const authorName = tweet.user?.name || tweet.user?.screen_name || 'Unknown'
    const createdAt = tweet.created_at
    const tweetText = tweet.full_text || tweet.text || ''
    
    if (!authorHandle) {
      console.warn(`Tweet ${tweetId} missing author handle`)
      return null
    }

    // Build article URL using priority order
    let articleUrl: string
    let restId: string | undefined

    if (articleResult.url) {
      // (a) Explicit URL if present
      articleUrl = articleResult.url
    } else if (articleResult.rest_id) {
      // (b) https://x.com/i/articles/{rest_id}
      restId = articleResult.rest_id
      articleUrl = `https://x.com/i/articles/${restId}`
    } else {
      // (c) Source post URL https://x.com/{author_handle}/status/{tweet_id}
      articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`
    }

    // Extract title and description
    const title = articleResult.title || tweetText.slice(0, 100) || 'Untitled Article'
    const excerpt = articleResult.description || tweetText.slice(0, 200) || undefined

    const harvestedArticle: HarvestedArticle = {
      article_url: articleUrl,
      title,
      excerpt,
      author_name: authorName,
      author_handle: authorHandle,
      tweet_id: tweetId,
      rest_id: restId,
      original_url: articleResult.url,
      created_at: createdAt,
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
    status: 'published' as const,
    published_at: publishedAt,
    meta_title: harvested.title,
    meta_description: excerpt,
    tags: ['twitter', 'imported'],
    category: 'twitter-import',
  }
}

/**
 * Batch upsert articles to database
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

  // Process each list
  for (const [listId, tweets] of listTweets) {
    const listStats = {
      listId,
      tweetsFound: tweets.length,
      articlesHarvested: 0,
      errors: [] as string[],
    }

    try {
      // Filter tweets to articles and map them
      const harvestedArticles: HarvestedArticle[] = []
      
      for (const tweet of tweets) {
        try {
          const article = mapTweetToArticle(tweet)
          if (article) {
            harvestedArticles.push(article)
          }
        } catch (error) {
          const errorMsg = `Error mapping tweet ${tweet.id_str}: ${error}`
          console.error(errorMsg)
          listStats.errors.push(errorMsg)
        }
      }

      listStats.articlesHarvested = harvestedArticles.length
      allHarvestedArticles.push(...harvestedArticles)

      console.log(`List ${listId}: Found ${tweets.length} tweets, harvested ${harvestedArticles.length} articles`)
      
    } catch (error) {
      const errorMsg = `Error processing list ${listId}: ${error}`
      console.error(errorMsg)
      listStats.errors.push(errorMsg)
    }

    stats.lists.push(listStats)
  }

  // Batch upsert all harvested articles
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