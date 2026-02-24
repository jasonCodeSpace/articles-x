/**
 * Step: Update Daily Indexing
 * Indexes NEW high-quality articles published within the lookback period
 * - Only indexes articles that are NOT already indexed
 * - Does NOT unindex any previously indexed articles
 * - Limited to maxDailyIndex articles per run to avoid spam detection
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { createClient } from '@supabase/supabase-js'

export interface UpdateIndexingInput {
  maxDailyIndex?: number // Max new articles to index per run (default: 10)
  minScore?: number // Minimum score to consider (default: 65)
  lookbackDays?: number // How many days back to look for new articles (default: 7)
}

export interface UpdateIndexingOutput {
  totalCandidates: number
  newlyIndexed: number
  skipped: number
  indexedArticles: Array<{ title: string; score: number; author: string; publishedAt: string }>
}

export const updateDailyIndexingStep = createStep<UpdateIndexingInput, UpdateIndexingOutput>(
  'update-daily-indexing',
  async (input: UpdateIndexingInput, ctx: WorkflowContext): Promise<StepResult<UpdateIndexingOutput>> => {
    try {
      const { maxDailyIndex = 10, minScore = 65, lookbackDays = 7 } = input

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase credentials not configured')
      }

      const supabase = createClient(supabaseUrl, serviceKey)

      // Calculate the cutoff date for new articles
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)
      const cutoffIso = cutoffDate.toISOString()

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'update-daily-indexing',
        message: `Looking for new articles to index (score >= ${minScore}, published since ${cutoffIso}, max ${maxDailyIndex})`
      })

      // Get NEW articles that are NOT already indexed, within lookback period, meeting score threshold
      const { data: candidates, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, author_handle, score, article_published_at')
        .eq('indexed', false) // Only get articles that are NOT already indexed
        .not('score', 'is', null)
        .gte('score', minScore)
        .gte('article_published_at', cutoffIso) // Only recent articles
        .order('score', { ascending: false })
        .order('article_published_at', { ascending: false })
        .limit(maxDailyIndex)

      if (fetchError) {
        throw new Error(`Failed to fetch articles: ${fetchError.message}`)
      }

      if (!candidates || candidates.length === 0) {
        ctx.logs.push({
          timestamp: new Date(),
          level: 'info',
          step: 'update-daily-indexing',
          message: `No new articles found meeting criteria`
        })

        return {
          success: true,
          data: {
            totalCandidates: 0,
            newlyIndexed: 0,
            skipped: 0,
            indexedArticles: []
          }
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'update-daily-indexing',
        message: `Found ${candidates.length} candidate articles to index`
      })

      // Get IDs for batch update
      const idsToIndex = candidates.map(a => a.id)

      // Update these articles to indexed=true
      const { error: indexError } = await supabase
        .from('articles')
        .update({ indexed: true })
        .in('id', idsToIndex)

      if (indexError) {
        ctx.logs.push({
          timestamp: new Date(),
          level: 'error',
          step: 'update-daily-indexing',
          message: `Failed to index articles: ${indexError.message}`
        })
        throw new Error(`Failed to index articles: ${indexError.message}`)
      }

      // Prepare output
      const indexedArticles = candidates.map(a => ({
        title: a.title,
        score: a.score || 0,
        author: a.author_handle || 'unknown',
        publishedAt: a.article_published_at || ''
      }))

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'update-daily-indexing',
        message: `Successfully indexed ${candidates.length} new articles`
      })

      // Log indexed articles
      for (const article of indexedArticles) {
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
          totalCandidates: candidates.length,
          newlyIndexed: candidates.length,
          skipped: 0,
          indexedArticles
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
