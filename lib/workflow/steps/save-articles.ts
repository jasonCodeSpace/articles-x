/**
 * Step 3: 保存文章到 Supabase
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { HarvestedArticle, batchUpsertArticles } from '@/lib/services/article'

export interface SaveArticlesInput {
  articles: HarvestedArticle[]
  totalTweets: number
  articlesFound: number
}

export interface SaveArticlesOutput {
  articles: HarvestedArticle[]
  inserted: number
  updated: number
  skipped: number
  deleted: number
}

export const saveArticlesStep = createStep<SaveArticlesInput, SaveArticlesOutput>(
  'save-articles',
  async (input: SaveArticlesInput, ctx: WorkflowContext): Promise<StepResult<SaveArticlesOutput>> => {
    try {
      const { articles } = input

      const result = await batchUpsertArticles(articles)

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'save-articles',
        message: `Saved articles: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped, ${result.deleted} deleted (too short)`
      })

      // 如果没有新文章插入，跳过后续步骤
      if (result.inserted === 0 && result.updated === 0) {
        return {
          success: true,
          skip: true,
          message: 'No new articles to process'
        }
      }

      return {
        success: true,
        data: {
          articles,
          ...result
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to save articles to database'
      }
    }
  },
  { retries: 2, retryDelay: 3000 }
)
