import { createServiceRoleClient } from '../client'
import type { TweetData, BatchResult } from '../../article/types'

/**
 * Tweet Repository
 * Handles all database operations for tweets
 */
export class TweetRepository {
  private client = createServiceRoleClient()

  /**
   * Check if a tweet exists
   */
  async findById(tweetId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('tweets')
      .select('tweet_id')
      .eq('tweet_id', tweetId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error(`Error checking existing tweet ${tweetId}:`, error)
      return false
    }

    return !!data
  }

  /**
   * Insert a new tweet
   */
  async insert(tweetData: TweetData): Promise<boolean> {
    const { error } = await this.client
      .from('tweets')
      .insert({
        tweet_id: tweetData.tweet_id,
        author_handle: tweetData.author_handle,
        has_article: tweetData.has_article,
      })

    if (error) {
      console.error(`Error inserting tweet ${tweetData.tweet_id}:`, error)
      return false
    }

    return true
  }

  /**
   * Update an existing tweet
   */
  async update(tweetData: TweetData): Promise<boolean> {
    const { error } = await this.client
      .from('tweets')
      .update({
        author_handle: tweetData.author_handle,
        has_article: tweetData.has_article,
      })
      .eq('tweet_id', tweetData.tweet_id)

    if (error) {
      console.error(`Error updating tweet ${tweetData.tweet_id}:`, error)
      return false
    }

    return true
  }

  /**
   * Batch upsert tweets
   */
  async batchUpsert(tweetDataArray: TweetData[], dryRun = false): Promise<BatchResult> {
    const result: BatchResult = { inserted: 0, updated: 0, skipped: 0, deleted: 0 }

    if (dryRun) {
      console.log(`[DRY RUN] Would process ${tweetDataArray.length} tweets`)
      return result
    }

    // Process in batches of 50
    const batchSize = 50

    for (let i = 0; i < tweetDataArray.length; i += batchSize) {
      const batch = tweetDataArray.slice(i, i + batchSize)

      for (const tweetData of batch) {
        try {
          const exists = await this.findById(tweetData.tweet_id)

          if (exists) {
            const success = await this.update(tweetData)
            if (success) {
              result.updated++
            } else {
              result.skipped++
            }
          } else {
            const success = await this.insert(tweetData)
            if (success) {
              result.inserted++
            } else {
              result.skipped++
            }
          }
        } catch (error) {
          console.error(`Unexpected error processing tweet ${tweetData.tweet_id}:`, error)
          result.skipped++
        }
      }
    }

    console.log(`Tweet batch processing complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`)
    return result
  }
}
