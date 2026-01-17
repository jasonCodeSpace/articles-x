import axios from 'axios'
import { RateLimiter } from './rate-limiter'
import type { TwitterTimelineResponse, TwitterTweet } from './types'
import { extractTweetsFromResponse, extractNextCursor, parseTweetFromDetail } from './parser'

export interface TwitterClientConfig {
  apiKey: string
  apiHost: string
  timeoutMs: number
}

export interface FetchListTimelineOptions {
  listId: string
  cursor?: string
  count?: number
}

export interface TwitterApiError extends Error {
  status?: number
  response?: unknown
}

/**
 * Twitter API Client
 * Handles all HTTP communication with the Twitter API
 */
export class TwitterClient {
  private config: TwitterClientConfig
  private rateLimiter: RateLimiter

  constructor(config: TwitterClientConfig) {
    this.config = config
    this.rateLimiter = new RateLimiter()
  }

  /**
   * Fetch timeline for a specific Twitter list
   */
  async fetchListTimeline(options: FetchListTimelineOptions): Promise<TwitterTimelineResponse> {
    return this.rateLimiter.execute(async () => {
      const url = `https://${this.config.apiHost}/list-timeline`
      const params = new URLSearchParams({
        listId: options.listId,
        count: (options.count || 20).toString(),
        ...(options.cursor && { cursor: options.cursor })
      })

      const response = await this.fetchWithRetry(`${url}?${params}`)

      if (!response.ok) {
        const error = new Error(`Twitter API error: ${response.status} ${response.statusText}`) as TwitterApiError
        error.status = response.status
        error.response = await response.json().catch(() => null)
        throw error
      }

      return (await response.json()) as TwitterTimelineResponse
    })
  }

  /**
   * Fetch a single tweet by ID
   */
  async fetchTweet(tweetId: string): Promise<TwitterTweet | null> {
    return this.rateLimiter.execute(async () => {
      const url = `https://${this.config.apiHost}/tweet-v2`
      const params = new URLSearchParams({ pid: tweetId })

      const response = await this.fetchWithRetry(`${url}?${params}`)

      if (!response.ok) {
        const error = new Error(`Twitter API error: ${response.status} ${response.statusText}`) as TwitterApiError
        error.status = response.status
        error.response = await response.json().catch(() => null)
        throw error
      }

      const data = await response.json()
      return parseTweetFromDetail(data)
    })
  }

  /**
   * Fetch all pages of a list timeline
   */
  async fetchAllListPages(listId: string, maxPages = 10): Promise<TwitterTweet[]> {
    const allTweets: TwitterTweet[] = []
    let cursor: string | undefined
    let pageCount = 0

    while (pageCount < maxPages) {
      try {
        const response = await this.fetchListTimeline({
          listId,
          cursor,
          count: 20
        })

        const tweets = extractTweetsFromResponse(response)
        allTweets.push(...tweets)

        const nextCursor = extractNextCursor(response)
        if (!nextCursor || nextCursor === cursor) {
          break
        }

        cursor = nextCursor
        pageCount++

        await RateLimiter.sleep(100)
      } catch (error) {
        console.error(`Error fetching page ${pageCount + 1} for list ${listId}:`, error)
        break
      }
    }

    return allTweets
  }

  /**
   * Fetch with retry logic for 429 and 5xx errors
   */
  private async fetchWithRetry(
    url: string,
    maxRetries = 3
  ): Promise<{ ok: boolean; status: number; statusText: string; json: () => Promise<unknown> }> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          headers: {
            'X-RapidAPI-Key': this.config.apiKey,
            'X-RapidAPI-Host': this.config.apiHost,
          },
          timeout: this.config.timeoutMs,
          validateStatus: () => true
        })

        const responseWrapper = {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          statusText: response.statusText,
          json: async () => response.data
        }

        if (responseWrapper.ok || (responseWrapper.status >= 400 && responseWrapper.status < 500 && responseWrapper.status !== 429)) {
          return responseWrapper
        }

        if (responseWrapper.status === 429 || responseWrapper.status >= 500) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
          console.warn(`Attempt ${attempt}/${maxRetries} failed with ${responseWrapper.status}. Retrying in ${delay}ms...`)

          if (attempt < maxRetries) {
            await RateLimiter.sleep(delay)
            continue
          }
        }

        return responseWrapper

      } catch (error) {
        lastError = error as Error
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error)

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
          await RateLimiter.sleep(delay)
        }
      }
    }

    throw lastError!
  }
}

/**
 * Create Twitter client with environment variables
 */
export function createTwitterClient(): TwitterClient {
  const apiKey = process.env.RAPIDAPI_KEY
  const apiHost = process.env.RAPIDAPI_HOST || 'twitter241.p.rapidapi.com'
  const timeoutMs = parseInt(process.env.TWITTER_TIMEOUT_MS || '15000')

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is required')
  }

  return new TwitterClient({
    apiKey,
    apiHost,
    timeoutMs,
  })
}
