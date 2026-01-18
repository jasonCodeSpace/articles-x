/**
 * Step 5: 保存摘要到 Supabase
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { ArticleWithSummary } from './generate-summaries'
import { generateSlug } from '@/lib/url-utils'
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
      let skipped = 0

      for (const { article, analysis } of processed) {
        try {
          // Generate proper slug now that we have title_english
          const newSlug = generateSlug(
            article.title,
            analysis.title_english,
            article.tweet_id
          )

          // 如果摘要被跳过（文章太短），只更新 title_english 和 slug，不保存摘要
          if (analysis.summary_skipped) {
            // Still need to update title_english and slug for short articles!
            const { error } = await supabase
              .from('articles')
              .update({
                title_english: analysis.title_english,
                slug: newSlug, // Update slug with proper English translation
                language: analysis.language
              })
              .eq('title', article.title)

            if (error) {
              ctx.logs.push({
                timestamp: new Date(),
                level: 'warn',
                step: 'save-summaries',
                message: `Failed to update title_english for: ${article.title} - ${error.message}`
              })
              failed++
            } else {
              ctx.logs.push({
                timestamp: new Date(),
                level: 'info',
                step: 'save-summaries',
                message: `Updated title_english for short article: ${article.title.substring(0, 40)}...`
              })
              saved++
            }
            skipped++
            continue
          }

          const { error } = await supabase
            .from('articles')
            .update({
              summary_chinese: analysis.summary_chinese,
              summary_english: analysis.summary_english,
              title_english: analysis.title_english,
              language: analysis.language,
              slug: newSlug, // Update slug with proper English translation
              summary_generated_at: new Date().toISOString()
            })
            .eq('title', article.title)

          if (error) {
            ctx.logs.push({
              timestamp: new Date(),
              level: 'warn',
              step: 'save-summaries',
              message: `Failed to save summary for: ${article.title} - ${error.message}`
            })
            failed++
          } else {
            saved++
            ctx.logs.push({
              timestamp: new Date(),
              level: 'info',
              step: 'save-summaries',
              message: `Saved ${analysis.word_count}w article: ${article.title.substring(0, 40)}...`
            })
          }
        } catch {
          failed++
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'save-summaries',
        message: `Saved ${saved} summaries, ${skipped} skipped (too short), ${failed} failed`
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
