/**
 * Ingest Service
 *
 * Orchestrates the ingestion of tweets and articles from Twitter lists
 */

import type { TwitterTweet } from './twitter'
import type { TweetData, IngestStats } from './article'
import { mapTweetToTweetData } from './article'
import { TweetRepository } from './database'

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
  const tweetRepository = new TweetRepository()

  // Process each list
  for (const [listId, tweets] of listTweets) {
    const listStats = {
      listId,
      tweetsFound: tweets.length,
      articlesHarvested: 0,
      errors: [] as string[],
    }

    try {
      const tweetDataForList: TweetData[] = []

      for (const tweet of tweets) {
        try {
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
      const tweetStats = await tweetRepository.batchUpsert(allTweetData, dryRun)
      console.log(`Tweet storage complete: ${tweetStats.inserted} inserted, ${tweetStats.updated} updated, ${tweetStats.skipped} skipped`)

      stats.inserted = tweetStats.inserted
      stats.updated = tweetStats.updated
      stats.skipped = tweetStats.skipped
    } catch (error) {
      console.error('Error saving tweets to database:', error)
    }
  }

  return stats
}
