/**
 * Step 2: 从推文中提取文章
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { TwitterTweet } from '@/lib/twitter'
import { mapTweetToArticle, HarvestedArticle } from '@/lib/ingest'

export interface ExtractArticlesInput {
  tweets: TwitterTweet[]
  listIds: string[]
  totalTweets: number
}

export interface ExtractArticlesOutput {
  articles: HarvestedArticle[]
  totalTweets: number
  articlesFound: number
}

export const extractArticlesStep = createStep<ExtractArticlesInput, ExtractArticlesOutput>(
  'extract-articles',
  async (input: ExtractArticlesInput, ctx: WorkflowContext): Promise<StepResult<ExtractArticlesOutput>> => {
    try {
      const { tweets } = input
      const articles: HarvestedArticle[] = []

      for (const tweet of tweets) {
        const article = mapTweetToArticle(tweet)
        if (article) {
          articles.push(article)
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'extract-articles',
        message: `Extracted ${articles.length} articles from ${tweets.length} tweets`
      })

      if (articles.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No articles found in tweets'
        }
      }

      return {
        success: true,
        data: {
          articles,
          totalTweets: tweets.length,
          articlesFound: articles.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to extract articles from tweets'
      }
    }
  }
)
