/**
 * Step: Update Global Top Indexing
 * Selects the global top 5 articles by score (all-time, not daily)
 * Only the top 5 highest-scoring articles are indexed for trending
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { createClient } from '@supabase/supabase-js'

export interface UpdateIndexingInput {
  topN?: number // How many articles to index (default: 5)
  minScore?: number // Minimum score to consider (default: 60)
}

export interface UpdateIndexingOutput {
  totalArticles: number
  indexedArticles: number
  unindexedArticles: number
  topScores: Array<{ title: string; score: number; author: string }>
}

export const updateDailyIndexingStep = createStep<UpdateIndexingInput, UpdateIndexingOutput>(
  'update-daily-indexing',
  async (input: UpdateIndexingInput, ctx: WorkflowContext): Promise<StepResult<UpdateIndexingOutput>> => {
    try {
      const { topN = 5, minScore = 70 } = input

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase credentials not configured')
      }

      const supabase = createClient(supabaseUrl, serviceKey)

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'update-daily-indexing',
        message: `Updating global top ${topN} indexing (min score: ${minScore})`
      })

      // Get ALL articles with scores, ordered by score (no date filter)
      const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, author_handle, score, article_published_at')
        .not('score', 'is', null)
        .gte('score', minScore)  // Only consider articles above minimum score
        .order('score', { ascending: false })
        .order('article_published_at', { ascending: false })  // Tie-break by recency

      if (fetchError) {
        throw new Error(`Failed to fetch articles: ${fetchError.message}`)
      }

      if (!articles || articles.length === 0) {
        return {
          success: true,
          skip: true,
          message: `No articles found with score >= ${minScore}`,
          data: {
            totalArticles: 0,
            indexedArticles: 0,
            unindexedArticles: 0,
            topScores: []
          }
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'update-daily-indexing',
        message: `Found ${articles.length} articles with score >= ${minScore} (evaluating globally)`
      })

      // Separate top N articles from the rest
      const topArticles = articles.slice(0, topN)
      const remainingArticles = articles.slice(topN)

      // Get IDs for batch updates
      const topIds = topArticles.map(a => a.id)
      const remainingIds = remainingArticles.map(a => a.id)

      // Update top articles to indexed=true
      let indexedCount = 0
      if (topIds.length > 0) {
        const { error: indexError } = await supabase
          .from('articles')
          .update({ indexed: true })
          .in('id', topIds)

        if (indexError) {
          ctx.logs.push({
            timestamp: new Date(),
            level: 'warn',
            step: 'update-daily-indexing',
            message: `Failed to index top articles: ${indexError.message}`
          })
        } else {
          indexedCount = topIds.length
        }
      }

      // Update remaining articles to indexed=false
      let unindexedCount = 0
      if (remainingIds.length > 0) {
        const { error: unindexError } = await supabase
          .from('articles')
          .update({ indexed: false })
          .in('id', remainingIds)

        if (unindexError) {
          ctx.logs.push({
            timestamp: new Date(),
            level: 'warn',
            step: 'update-daily-indexing',
            message: `Failed to unindex remaining articles: ${unindexError.message}`
          })
        } else {
          unindexedCount = remainingIds.length
        }
      }

      // Prepare top scores for output
      const topScores = topArticles.map(a => ({
        title: a.title,
        score: a.score || 0,
        author: a.author_handle || 'unknown'
      }))

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'update-daily-indexing',
        message: `Indexed ${indexedCount} articles, unindexed ${unindexedCount} articles`
      })

      // Log top articles
      for (const article of topScores) {
        ctx.logs.push({
          timestamp: new Date(),
          level: 'info',
          step: 'update-daily-indexing',
          message: `  [${article.score}] ${article.title.substring(0, 50)}... by @${article.author}`
        })
      }

      return {
        success: true,
        data: {
          totalArticles: articles.length,
          indexedArticles: indexedCount,
          unindexedArticles: unindexedCount,
          topScores
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to update daily indexing'
      }
    }
  },
  { retries: 2, retryDelay: 5000 }
)
