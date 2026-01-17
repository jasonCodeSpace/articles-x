import type { TwitterTimelineResponse, TwitterTweet } from './types'
import { TweetSchema } from './types'

/**
 * Parse and extract tweets from Twitter API timeline response
 */
export function extractTweetsFromResponse(data: TwitterTimelineResponse): TwitterTweet[] {
  const tweets: TwitterTweet[] = []

  try {
    const instructions = data?.result?.timeline?.instructions || []

    for (const instruction of instructions) {
      if (!instruction.entries) continue

      for (const entry of instruction.entries) {
        // More flexible parsing - check for tweet_results directly
        const content = entry.content as {
          entryType?: string
          __typename?: string
          itemContent?: {
            itemType?: string
            tweet_results?: { result?: unknown }
          }
        }
        if (!content) continue

        // Get tweet from itemContent.tweet_results
        const tweetResult = content.itemContent?.tweet_results?.result
        if (tweetResult) {
          const parsed = TweetSchema.safeParse(tweetResult)
          if (parsed.success) {
            tweets.push(parsed.data)
          } else {
            console.warn('Failed to parse tweet:', parsed.error.issues?.[0]?.message || 'validation failed')
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
 * Extract next cursor from Twitter API timeline response
 */
export function extractNextCursor(data: TwitterTimelineResponse): string | undefined {
  try {
    const instructions = data?.result?.timeline?.instructions || []

    for (const instruction of instructions) {
      if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
        for (const entry of instruction.entries) {
          if (entry.content?.entryType === 'TimelineTimelineCursor') {
            const cursorContent = entry.content as { cursorType?: string; value?: string }
            if (cursorContent?.cursorType === 'Bottom') {
              return cursorContent.value
            }
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
 * Parse tweet from tweet detail API response
 * Handles multiple response structures from the API
 */
export function parseTweetFromDetail(data: unknown): TwitterTweet | null {
  const response = data as {
    result?: {
      tweetResult?: { result?: unknown }
      tweet_results?: { result?: unknown }
    }
    data?: {
      threaded_conversation_with_injections_v2?: {
        instructions?: Array<{
          type?: string
          entries?: Array<{
            content?: {
              itemContent?: {
                tweet_results?: { result?: unknown }
              }
            }
          }>
        }>
      }
    }
  }

  // Try tweet-v2 response structure first (result.tweetResult.result)
  let tweet: unknown = response?.result?.tweetResult?.result

  // Try threaded_conversation structure
  if (!tweet) {
    const instructions = response?.data?.threaded_conversation_with_injections_v2?.instructions
    if (instructions) {
      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
          for (const entry of instruction.entries) {
            if (entry.content?.itemContent?.tweet_results?.result) {
              tweet = entry.content.itemContent.tweet_results.result
              break
            }
          }
          if (tweet) break
        }
      }
    }
  }

  // Fallback to old response structure
  if (!tweet) {
    tweet = response?.result?.tweet_results?.result
  }

  if (tweet) {
    const parsed = TweetSchema.safeParse(tweet)
    if (parsed.success) {
      return parsed.data
    } else {
      console.warn('Failed to parse tweet:', parsed.error)
    }
  }

  return null
}
