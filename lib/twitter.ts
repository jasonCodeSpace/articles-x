import { z } from 'zod'

// Zod schemas for Twitter API response validation
const TwitterUserSchema = z.object({
  id_str: z.string(),
  screen_name: z.string(),
  name: z.string().optional(),
})

const ArticleResultSchema = z.object({
  result: z.object({
    rest_id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
}).optional()

const TweetSchema = z.object({
  id_str: z.string(),
  full_text: z.string().optional(),
  text: z.string().optional(),
  created_at: z.string(),
  user: TwitterUserSchema.optional(),
  article_results: ArticleResultSchema,
})

const TimelineNodeSchema = z.object({
  content: z.object({
    itemContent: z.object({
      tweet_results: z.object({
        result: TweetSchema,
      }).optional(),
    }).optional(),
  }).optional(),
})

const TimelineResponseSchema = z.object({
  data: z.object({
    list: z.object({
      tweets_timeline: z.object({
        timeline: z.object({
          instructions: z.array(z.object({
            type: z.string(),
            entries: z.array(z.object({
              entryId: z.string(),
              content: z.union([
                z.object({
                  entryType: z.literal('TimelineTimelineItem'),
                  itemContent: z.object({
                    itemType: z.literal('TimelineTweet'),
                    tweet_results: z.object({
                      result: TweetSchema,
                    }),
                  }),
                }),
                z.object({
                  entryType: z.literal('TimelineTimelineCursor'),
                  value: z.string(),
                  cursorType: z.string(),
                }),
                z.object({}).passthrough(), // Allow other entry types
              ]),
            })),
          })),
        }),
      }),
    }),
  }),
})

export type TwitterTimelineResponse = z.infer<typeof TimelineResponseSchema>
export type TwitterTweet = z.infer<typeof TweetSchema>

interface TwitterClientConfig {
  apiKey: string
  apiHost: string
  maxPagesPerList: number
  timeoutMs: number
}

interface FetchListTimelineOptions {
  listId: string
  cursor?: string
}

interface TwitterApiError extends Error {
  status?: number
  response?: any
}

export class TwitterClient {
  private config: TwitterClientConfig

  constructor(config: TwitterClientConfig) {
    this.config = config
  }

  /**
   * Fetch timeline for a Twitter list with pagination support
   */
  async fetchListTimeline(
    options: FetchListTimelineOptions
  ): Promise<{ tweets: TwitterTweet[]; nextCursor?: string }> {
    const url = new URL('https://twitter241.p.rapidapi.com/list-timeline')
    url.searchParams.set('listId', options.listId)
    
    if (options.cursor) {
      url.searchParams.set('cursor', options.cursor)
    }

    const response = await this.fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-host': this.config.apiHost,
        'x-rapidapi-key': this.config.apiKey,
      },
      signal: AbortSignal.timeout(this.config.timeoutMs),
    })

    if (!response.ok) {
      const error = new Error(`Twitter API error: ${response.status} ${response.statusText}`) as TwitterApiError
      error.status = response.status
      try {
        error.response = await response.json()
      } catch {
        // Ignore JSON parse errors
      }
      throw error
    }

    const data = await response.json()
    
    // Validate response structure
    const parsed = TimelineResponseSchema.safeParse(data)
    if (!parsed.success) {
      console.warn('Twitter API response validation failed:', parsed.error)
      // Continue with best-effort parsing
    }

    const tweets = this.extractTweetsFromResponse(data)
    const nextCursor = this.extractNextCursor(data)

    return { tweets, nextCursor }
  }

  /**
   * Fetch all pages of a list timeline up to maxPagesPerList
   */
  async fetchAllListPages(listId: string): Promise<TwitterTweet[]> {
    const allTweets: TwitterTweet[] = []
    let cursor: string | undefined
    let pageCount = 0

    while (pageCount < this.config.maxPagesPerList) {
      try {
        console.log(`Fetching page ${pageCount + 1} for list ${listId}${cursor ? ` (cursor: ${cursor.slice(0, 20)}...)` : ''}`)
        
        const result = await this.fetchListTimeline({ listId, cursor })
        
        allTweets.push(...result.tweets)
        cursor = result.nextCursor
        pageCount++

        // If no next cursor, we've reached the end
        if (!cursor) {
          console.log(`Reached end of list ${listId} at page ${pageCount}`)
          break
        }

        // Small delay between requests to be respectful
        await this.sleep(1000)
        
      } catch (error) {
        console.error(`Error fetching page ${pageCount + 1} for list ${listId}:`, error)
        
        // If it's a rate limit or server error, stop pagination for this list
        if (error instanceof Error && 'status' in error) {
          const status = (error as TwitterApiError).status
          if (status === 429 || (status && status >= 500)) {
            console.log(`Stopping pagination for list ${listId} due to ${status} error`)
            break
          }
        }
        
        throw error // Re-throw other errors
      }
    }

    console.log(`Collected ${allTweets.length} tweets from ${pageCount} pages for list ${listId}`)
    return allTweets
  }

  /**
   * Extract tweets from Twitter API response
   */
  private extractTweetsFromResponse(data: any): TwitterTweet[] {
    const tweets: TwitterTweet[] = []

    try {
      const instructions = data?.data?.list?.tweets_timeline?.timeline?.instructions || []
      
      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
          for (const entry of instruction.entries) {
            if (entry.content?.entryType === 'TimelineTimelineItem' && 
                entry.content?.itemContent?.itemType === 'TimelineTweet') {
              const tweet = entry.content.itemContent.tweet_results?.result
              if (tweet) {
                const parsed = TweetSchema.safeParse(tweet)
                if (parsed.success) {
                  tweets.push(parsed.data)
                } else {
                  console.warn('Failed to parse tweet:', parsed.error)
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting tweets from response:', error)
    }

    return tweets
  }

  /**
   * Extract next cursor from Twitter API response
   */
  private extractNextCursor(data: any): string | undefined {
    try {
      const instructions = data?.data?.list?.tweets_timeline?.timeline?.instructions || []
      
      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
          for (const entry of instruction.entries) {
            if (entry.content?.entryType === 'TimelineTimelineCursor' && 
                entry.content?.cursorType === 'Bottom') {
              return entry.content.value
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting cursor from response:', error)
    }

    return undefined
  }

  /**
   * Fetch with retry logic for 429 and 5xx errors
   */
  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)

        // If successful or client error (not 429), return immediately
        if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
          return response
        }

        // For 429 or 5xx errors, implement exponential backoff
        if (response.status === 429 || response.status >= 500) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000) // Max 30s delay
          console.warn(`Attempt ${attempt}/${maxRetries} failed with ${response.status}. Retrying in ${delay}ms...`)
          
          if (attempt < maxRetries) {
            await this.sleep(delay)
            continue
          }
        }

        return response
        
      } catch (error) {
        lastError = error as Error
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error)
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
          await this.sleep(delay)
        }
      }
    }

    throw lastError!
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Create Twitter client with environment variables
 */
export function createTwitterClient(): TwitterClient {
  const apiKey = process.env.RAPIDAPI_KEY
  const apiHost = process.env.RAPIDAPI_HOST || 'twitter241.p.rapidapi.com'
  const maxPagesPerList = parseInt(process.env.MAX_PAGES_PER_LIST || '10')
  const timeoutMs = parseInt(process.env.TWITTER_TIMEOUT_MS || '15000')

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is required')
  }

  return new TwitterClient({
    apiKey,
    apiHost,
    maxPagesPerList,
    timeoutMs,
  })
}