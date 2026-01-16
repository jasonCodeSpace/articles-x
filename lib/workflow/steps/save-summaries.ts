/**
 * Step 5: 保存摘要到 Supabase
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { ArticleWithSummary } from './generate-summaries'
import { createClient } from '@supabase/supabase-js'

export interface SaveSummariesInput {
  processed: ArticleWithSummary[]
  failed: string[]
}

export interface SaveSummariesOutput {
  saved: number
  failed: number
}

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables not set')
  }
  return createClient(supabaseUrl, serviceKey)
}

export const saveSummariesStep = createStep<SaveSummariesInput, SaveSummariesOutput>(
  'save-summaries',
  async (input: SaveSummariesInput, ctx: WorkflowContext): Promise<StepResult<SaveSummariesOutput>> => {
    try {
      const { processed } = input
      const supabase = createServiceRoleClient()
      let saved = 0
      let failed = 0

      for (const { article, analysis } of processed) {
        try {
          const { error } = await supabase
            .from('articles')
            .update({
              summary_chinese: analysis.summary.chinese,
              summary_english: analysis.summary.english,
              language: analysis.language,
              category: analysis.category,
              summary_generated_at: new Date().toISOString()
            })
            .eq('title', article.title)

          if (error) {
            ctx.logs.push({
              timestamp: new Date(),
              level: 'warn',
              step: 'save-summaries',
              message: `Failed to save summary for: ${article.title}`
            })
            failed++
          } else {
            saved++
          }
        } catch {
          failed++
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'save-summaries',
        message: `Saved ${saved} summaries, ${failed} failed`
      })

      return {
        success: true,
        data: { saved, failed }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to save summaries'
      }
    }
  },
  { retries: 2, retryDelay: 3000 }
)
