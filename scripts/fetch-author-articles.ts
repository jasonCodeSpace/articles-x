/**
 * Fetch articles from top 100 authors' tweets
 *
 * Process:
 * 1. Read top100-authors.json
 * 2. For each author, search for their tweets containing URLs
 * 3. Extract article URLs from tweets
 * 4. Fetch full article content
 * 5. Generate summaries with DeepSeek
 * 6. Upload to Supabase with deduplication
 *
 * Usage: npx tsx scripts/fetch-author-articles.ts
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: '.env.local' })

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'ab9b25a33dmsh9bbd3a16233f27dp1d0125jsn3cc5b2112be6'
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// DeepSeek API
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

// Author data
interface AuthorData {
  user_id: string
  screen_name: string
  name: string
  verified: boolean
  profile_image_url: string
  followers_count: number
}

// Twitter search response
interface SearchResponse {
  cursor?: {
    bottom?: string
  }
  result?: {
    timeline?: {
      instructions?: Array<{
        type?: string
        entries?: Array<{
          entryId?: string
          content?: {
            itemContent?: {
              tweet_results?: {
                result?: TwitterTweet
              }
            }
          }
        }>
      }>
    }
  }
}

interface TwitterTweet {
  rest_id: string
  legacy?: {
    id_str?: string
    full_text?: string
    created_at?: string
    favorite_count?: number
    retweet_count?: number
    reply_count?: number
    quote_count?: number
    conversation_id_str?: string
    entities?: {
      urls?: Array<{
        expanded_url?: string
        url?: string
        display_url?: string
      }>
      user_mentions?: Array<{
        screen_name?: string
      }>
    }
  }
  core?: {
    user_results?: {
      result?: {
        rest_id?: string
        legacy?: {
          screen_name?: string
          name?: string
          profile_image_url_https?: string
        }
      }
    }
  }
  views?: {
    count?: string
  }
}

interface Article {
  url: string
  title: string
  content: string
  author_name: string
  author_handle: string
  author_avatar: string
  tweet_url: string
  published_at: string
}

// Stats
const stats = {
  authorsProcessed: 0,
  tweetsFetched: 0,
  articlesFound: 0,
  articlesUploaded: 0,
  articlesSkipped: 0,
  summariesGenerated: 0,
  errors: 0
}

/**
 * Search for tweets from a specific user containing URLs
 */
async function searchUserTweets(screenName: string, maxPages = 3): Promise<TwitterTweet[]> {
  const tweets: TwitterTweet[] = []
  const seenIds = new Set<string>()
  let cursor: string | undefined = undefined
  let pageCount = 0

  // Search for tweets from this user containing URLs
  const query = `from:${screenName} http`

  while (pageCount < maxPages) {
    try {
      const params: Record<string, string> = {
        type: 'Latest',
        query,
        count: '20'
      }
      if (cursor) {
        params.cursor = cursor
      }

      const response = await axios.get<SearchResponse>(
        `https://${RAPIDAPI_HOST}/search`,
        {
          params,
          headers: {
            'x-rapidapi-host': RAPIDAPI_HOST,
            'x-rapidapi-key': RAPIDAPI_KEY
          },
          timeout: 30000
        }
      )

      // Extract tweets from response
      const instructions = response.data.result?.timeline?.instructions || []

      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
          for (const entry of instruction.entries) {
            if (entry.entryId?.startsWith('tweet-')) {
              const tweet = entry.content?.itemContent?.tweet_results?.result
              if (tweet && !seenIds.has(tweet.rest_id)) {
                seenIds.add(tweet.rest_id)
                tweets.push(tweet)
              }
            }
          }
        }
      }

      // Get next cursor
      cursor = response.data.cursor?.bottom
      if (!cursor) break

      pageCount++
      stats.tweetsFetched += tweets.length

      await sleep(300)
    } catch (error) {
      console.error(`  Error searching tweets for @${screenName}:`, error)
      break
    }
  }

  return tweets
}

/**
 * Extract article URLs from a tweet
 */
function extractArticleUrls(tweet: TwitterTweet): string[] {
  const urls: string[] = []

  // Check entities.urls
  if (tweet.legacy?.entities?.urls) {
    for (const urlObj of tweet.legacy.entities.urls) {
      if (urlObj.expanded_url) {
        // Filter out X/Twitter internal links
        if (!urlObj.expanded_url.includes('x.com') &&
            !urlObj.expanded_url.includes('twitter.com')) {
          urls.push(urlObj.expanded_url)
        }
      }
    }
  }

  // Also check full_text for URLs
  if (tweet.legacy?.full_text) {
    const urlRegex = /https?:\/\/[^\s]+/g
    const matches = tweet.legacy.full_text.match(urlRegex)
    if (matches) {
      for (const url of matches) {
        if (!url.includes('x.com') && !url.includes('twitter.com')) {
          // Unwrap t.co links if needed
          urls.push(url)
        }
      }
    }
  }

  return [...new Set(urls)] // Deduplicate
}

/**
 * Fetch article content from URL
 */
async function fetchArticleContent(url: string): Promise<{ title: string; content: string } | null> {
  try {
    // Use a simple extraction approach
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const html = response.data

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled'

    // Extract main content (simple approach)
    // Try common content selectors
    const contentSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i
    ]

    let content = ''
    for (const selector of contentSelectors) {
      const match = html.match(selector)
      if (match) {
        // Remove HTML tags and get plain text
        content = match[1]
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (content.length > 200) break
      }
    }

    // If no content found, get meta description
    if (content.length < 200) {
      const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)
      if (descMatch) {
        content = descMatch[1]
      }
    }

    return { title, content: content.substring(0, 10000) } // Limit content length
  } catch (error) {
    console.error(`    Failed to fetch ${url}:`, error)
    return null
  }
}

/**
 * Generate summary using DeepSeek
 */
async function generateSummary(content: string, title: string): Promise<{ summary_english: string; summary_chinese: string } | null> {
  try {
    // Truncate content if too long (for API limit)
    const maxLength = 8000
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content

    const prompt = `Please analyze the following article and provide a concise summary.

Title: ${title}

Content:
${truncatedContent}

Please provide:
1. A 2-3 sentence summary in English
2. The same summary translated to Chinese

Format your response as:
ENGLISH: [summary]
CHINESE: [summary]`

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    )

    const text = response.data.choices[0].message.content

    // Parse the response
    const englishMatch = text.match(/ENGLISH:\s*([\s\S]+?)(?=\nCHINESE:|$)/i)
    const chineseMatch = text.match(/CHINESE:\s*([\s\S]+?)$/i)

    const summary_english = englishMatch ? englishMatch[1].trim() : text.substring(0, 500)
    const summary_chinese = chineseMatch ? chineseMatch[1].trim() : ''

    return { summary_english, summary_chinese }
  } catch (error) {
    console.error('    DeepSeek API error:', error)
    return null
  }
}

/**
 * Check if article already exists in database
 */
async function articleExists(url: string): Promise<boolean> {
  const { data } = await supabase
    .from('articles')
    .select('id')
    .eq('article_url', url)
    .limit(1)

  return !!(data && data.length > 0)
}

/**
 * Upload article to Supabase
 */
async function uploadArticle(article: Article, summary_english: string, summary_chinese: string): Promise<boolean> {
  try {
    // Check for duplicates by URL
    if (await articleExists(article.url)) {
      stats.articlesSkipped++
      return false
    }

    // Generate slug from title
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100)

    const { error } = await supabase
      .from('articles')
      .insert({
        title: article.title,
        slug,
        image: article.author_avatar,
        author_name: article.author_name,
        author_handle: article.author_handle,
        author_avatar: article.author_avatar,
        article_published_at: article.published_at,
        updated_at: new Date().toISOString(),
        tweet_views: '0',
        tweet_replies: '0',
        tweet_likes: '0',
        article_url: article.url,
        language: 'en',
        summary_english,
        summary_chinese,
        full_article_content: article.content,
        summary_generated_at: new Date().toISOString()
      })

    if (error) {
      console.error(`    Upload error:`, error.message)
      stats.errors++
      return false
    }

    stats.articlesUploaded++
    return true
  } catch (error) {
    console.error(`    Upload exception:`, error)
    stats.errors++
    return false
  }
}

/**
 * Process a single author
 */
async function processAuthor(author: AuthorData): Promise<void> {
  console.log(`\n[${stats.authorsProcessed + 1}/100] Processing @${author.screen_name} (${author.followers_count.toLocaleString()} followers)`)

  // Search for tweets with URLs
  const tweets = await searchUserTweets(author.screen_name, 3)
  console.log(`  Found ${tweets.length} tweets`)

  if (tweets.length === 0) {
    return
  }

  // Extract URLs from tweets
  const allUrls: string[] = []
  for (const tweet of tweets) {
    const urls = extractArticleUrls(tweet)
    allUrls.push(...urls)
  }

  const uniqueUrls = [...new Set(allUrls)]
  console.log(`  Found ${uniqueUrls.length} unique URLs`)

  if (uniqueUrls.length === 0) {
    return
  }

  // Process each URL (limit to 5 per author to save time)
  const urlsToProcess = uniqueUrls.slice(0, 5)
  console.log(`  Processing ${urlsToProcess.length} URLs...`)

  for (const url of urlsToProcess) {
    try {
      // Check if already exists
      if (await articleExists(url)) {
        stats.articlesSkipped++
        continue
      }

      // Fetch article content
      const articleData = await fetchArticleContent(url)
      if (!articleData) {
        continue
      }

      stats.articlesFound++

      // Generate summary (only for content > 100 words)
      const wordCount = articleData.content.split(/\s+/).length
      let summary_english = ''
      let summary_chinese = ''

      if (wordCount > 100) {
        const summary = await generateSummary(articleData.content, articleData.title)
        if (summary) {
          summary_english = summary.summary_english
          summary_chinese = summary.summary_chinese
          stats.summariesGenerated++
        }
      }

      // Upload to Supabase
      const article: Article = {
        url,
        title: articleData.title,
        content: articleData.content,
        author_name: author.name,
        author_handle: author.screen_name,
        author_avatar: author.profile_image_url,
        tweet_url: `https://x.com/${author.screen_name}`,
        published_at: new Date().toISOString()
      }

      await uploadArticle(article, summary_english, summary_chinese)

      console.log(`    ✓ Uploaded: ${articleData.title.substring(0, 40)}...`)

      // Rate limiting
      await sleep(1000)
    } catch (error) {
      console.error(`    Error processing ${url}:`, error)
      stats.errors++
    }
  }

  stats.authorsProcessed++
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main function
 */
async function main() {
  console.log('=== Fetch Articles from Top 100 Authors ===\n')

  // Read top100-authors.json
  let authors: AuthorData[]
  try {
    const fileContent = readFileSync('/Users/haochengwang/Desktop/claude/xarticle/top100-authors.json', 'utf-8')
    authors = JSON.parse(fileContent)
    console.log(`Loaded ${authors.length} authors from top100-authors.json\n`)
  } catch (error) {
    console.error('Failed to read top100-authors.json:', error)
    return
  }

  // Process each author
  // TEST: Only process first author
  const authorsToProcess = authors.slice(0, 1)  // Remove .slice(0, 1) to process all
  for (const author of authorsToProcess) {
    await processAuthor(author)

    // Progress update every 10 authors
    if ((stats.authorsProcessed % 10) === 0) {
      console.log(`\n--- Progress: ${stats.authorsProcessed}/100 authors processed ---`)
      console.log(`Articles found: ${stats.articlesFound}, Uploaded: ${stats.articlesUploaded}, Skipped: ${stats.articlesSkipped}`)
    }
  }

  // Final stats
  console.log('\n=== Final Statistics ===')
  console.log(`Authors processed: ${stats.authorsProcessed}`)
  console.log(`Tweets fetched: ${stats.tweetsFetched}`)
  console.log(`Articles found: ${stats.articlesFound}`)
  console.log(`Articles uploaded: ${stats.articlesUploaded}`)
  console.log(`Articles skipped (duplicates): ${stats.articlesSkipped}`)
  console.log(`Summaries generated: ${stats.summariesGenerated}`)
  console.log(`Errors: ${stats.errors}`)
  console.log('\nDone!')
}

main().catch(console.error)
