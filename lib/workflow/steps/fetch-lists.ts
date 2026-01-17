/**
 * Step 1: 从 Twitter Lists 获取推文
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { createTwitterClient, TwitterTweet } from '@/lib/services/twitter'
import { getActiveTwitterListIds } from '@/lib/twitter-lists'

export interface FetchListsOutput {
  tweets: TwitterTweet[]
  listIds: string[]
  totalTweets: number
}

export const fetchListsStep = createStep<unknown, FetchListsOutput>(
  'fetch-lists',
  async (_input: unknown, ctx: WorkflowContext): Promise<StepResult<FetchListsOutput>> => {
    try {
      // 获取活跃的 Twitter Lists
      const listIds = await getActiveTwitterListIds()

      if (listIds.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No active Twitter lists found'
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'fetch-lists',
        message: `Found ${listIds.length} active lists`
      })

      const client = createTwitterClient()
      const allTweets: TwitterTweet[] = []

      // 并发获取所有 lists 的推文
      for (const listId of listIds) {
        try {
          const tweets = await client.fetchAllListPages(listId, 3) // 最多3页
          allTweets.push(...tweets)

          ctx.logs.push({
            timestamp: new Date(),
            level: 'debug',
            step: 'fetch-lists',
            message: `List ${listId}: fetched ${tweets.length} tweets`
          })
        } catch (error) {
          ctx.logs.push({
            timestamp: new Date(),
            level: 'warn',
            step: 'fetch-lists',
            message: `Failed to fetch list ${listId}: ${error}`
          })
        }
      }

      if (allTweets.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No tweets found in any list'
        }
      }

      return {
        success: true,
        data: {
          tweets: allTweets,
          listIds,
          totalTweets: allTweets.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to fetch Twitter lists'
      }
    }
  },
  { retries: 2, retryDelay: 5000 }
)
