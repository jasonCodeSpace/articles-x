/**
 * Cleanup Step for Low-Score Articles
 * Removes full content and images from articles with score < 65
 * Keeps only: title, author, url, views, score
 */
import { createServiceClient } from '@/lib/supabase/service'
import type { WorkflowStep, WorkflowContext, StepResult } from '../engine'

export interface CleanupInput {
  dryRun?: boolean
  minScore?: number
}

export interface CleanupOutput {
  processed: number
  cleaned: number
  skipped: number
  errors: number
}

export const cleanupLowScoreStep: WorkflowStep<CleanupInput, CleanupOutput> = {
  name: 'cleanup-low-score-articles',
  retries: 1,
  retryDelay: 1000,

  async execute(input: CleanupInput = {}, ctx: WorkflowContext): Promise<StepResult<CleanupOutput>> {
    const { dryRun = false, minScore = 65 } = input
    const supabase = createServiceClient()

    log(ctx, 'info', `Starting cleanup of articles with score < ${minScore}`)

    // Get articles with score < threshold that have full content
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, score')
      .lt('score', minScore)
      .not('full_article_content', 'is', null)

    if (error) {
      log(ctx, 'error', 'Error fetching articles', error)
      return { success: false, error }
    }

    const processed = articles?.length || 0
    log(ctx, 'info', `Found ${processed} articles with full content to clean`)

    if (processed === 0) {
      return { success: true, data: { processed: 0, cleaned: 0, skipped: 0, errors: 0 } }
    }

    let cleaned = 0
    const skipped = 0
    let errors = 0

    for (const article of articles || []) {
      try {
        // Remove full content and other heavy data
        const cleanupData = {
          full_article_content: null,
          summary_english: null,
          summary_chinese: null,
          summary_generated_at: null,
          image: null,
          language: null,
        }

        if (dryRun) {
          log(ctx, 'debug', `[DRY RUN] Would clean: ${article.title?.substring(0, 50)}... (score: ${article.score})`)
          cleaned++
        } else {
          const { error: updateError } = await supabase
            .from('articles')
            .update(cleanupData)
            .eq('id', article.id)

          if (updateError) {
            log(ctx, 'error', `Error cleaning article ${article.id}`, updateError)
            errors++
          } else {
            cleaned++
            if (cleaned <= 10) {
              log(ctx, 'info', `Cleaned: ${article.title?.substring(0, 50)}... (score: ${article.score})`)
            }
          }
        }
      } catch (err) {
        log(ctx, 'error', `Error processing article ${article.id}`, err)
        errors++
      }
    }

    const result: CleanupOutput = { processed, cleaned, skipped, errors }
    log(ctx, 'info', `Cleanup complete: ${cleaned} cleaned, ${errors} errors`)

    return { success: true, data: result }
  }
}

// Helper log function
function log(ctx: WorkflowContext, level: 'info' | 'error' | 'debug', message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const prefix = `[cleanup-low-score-articles]`

  switch (level) {
    case 'error':
      console.error(`${timestamp} ${prefix} ${message}`, data || '')
      break
    case 'debug':
      if (process.env.WORKFLOW_DEBUG === 'true') {
        console.log(`${timestamp} ${prefix} [DEBUG] ${message}`, data || '')
      }
      break
    default:
      console.log(`${timestamp} ${prefix} ${message}`)
  }
}
