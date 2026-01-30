/**
 * Step: Daily Indexing Adjustment
 * Runs at 23:50 daily to ensure 5-7 articles are indexed
 * - If < 5 articles: promote from archive
 * - If > 7 articles: demote to archive
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { createClient } from '@supabase/supabase-js'

export interface DailyAdjustmentInput {
  minArticles?: number // Minimum articles to keep indexed (default: 5)
  maxArticles?: number // Maximum articles to keep indexed (default: 7)
}

export interface DailyAdjustmentOutput {
  beforeCount: number
  afterCount: number
  promoted: number
  demoted: number
  promotedArticles: Array<{ title: string; score: number }>
}

export const dailyAdjustmentStep = createStep<DailyAdjustmentInput, DailyAdjustmentOutput>(
  'daily-adjustment',
  async (input: DailyAdjustmentInput, ctx: WorkflowContext): Promise<StepResult<DailyAdjustmentOutput>> => {
    try {
      const { minArticles = 5, maxArticles = 7 } = input

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase credentials not configured')
      }

      const supabase = createClient(supabaseUrl, serviceKey)

      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'daily-adjustment',
        message: `Running daily adjustment (target: ${minArticles}-${maxArticles} articles)`
      })

      // Count currently indexed articles (global, not just today)
      const { data: indexedArticles, error: indexedError } = await supabase
        .from('articles')
        .select('id, title, score, article_published_at')
        .eq('indexed', true)
        .order('score', { ascending: false })

      if (indexedError) {
        throw new Error(`Failed to fetch indexed articles: ${indexedError.message}`)
      }

      const beforeCount = indexedArticles?.length || 0
      let promotedCount = 0
      let demotedCount = 0
      const promotedArticles: Array<{ title: string; score: number }> = []

      // If too many articles indexed, demote the lowest scoring ones
      if (beforeCount > maxArticles) {
        const toDemote = beforeCount - maxArticles
        const lowestScored = indexedArticles?.slice(-toDemote) || []
        const demoteIds = lowestScored.map(a => a.id)

        const { error: demoteError } = await supabase
          .from('articles')
          .update({ indexed: false })
          .in('id', demoteIds)

        if (!demoteError) {
          demotedCount = toDemote
          ctx.logs.push({
            timestamp: new Date(),
            level: 'info',
            step: 'daily-adjustment',
            message: `Demoted ${toDemote} articles (exceeded ${maxArticles} limit)`
          })
        }
      }

      // If too few articles indexed, promote from archive
      if (beforeCount < minArticles) {
        const needed = minArticles - beforeCount

        // Get best articles from archive (not indexed, score >= 65)
        const { data: archiveArticles, error: archiveError } = await supabase
          .from('articles')
          .select('id, title, score, article_published_at')
          .or('indexed.is.null,indexed.eq.false')
          .gte('score', 65)
          .order('score', { ascending: false })
          .order('article_published_at', { ascending: false })
          .limit(needed)

        if (!archiveError && archiveArticles && archiveArticles.length > 0) {
          const promoteIds = archiveArticles.map(a => a.id)

          const { error: promoteError } = await supabase
            .from('articles')
            .update({ indexed: true })
            .in('id', promoteIds)

          if (!promoteError) {
            promotedCount = archiveArticles.length
            for (const article of archiveArticles) {
              promotedArticles.push({ title: article.title, score: article.score || 0 })
            }
            ctx.logs.push({
              timestamp: new Date(),
              level: 'info',
              step: 'daily-adjustment',
              message: `Promoted ${archiveArticles.length} articles from archive`
            })
          }
        }
      }

      // Get final count
      const { data: finalIndexed, error: finalError } = await supabase
        .from('articles')
        .select('id')
        .eq('indexed', true)

      const afterCount = finalIndexed?.length || 0

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'daily-adjustment',
        message: `Adjustment complete: ${beforeCount} → ${afterCount} articles`
      })

      return {
        success: true,
        data: {
          beforeCount,
          afterCount,
          promoted: promotedCount,
          demoted: demotedCount,
          promotedArticles
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to run daily adjustment'
      }
    }
  },
  { retries: 1, retryDelay: 3000 }
)
