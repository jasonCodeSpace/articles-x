/**
 * Step 5: 保存摘要到 Supabase (包括分类)
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

// Category keyword patterns (same as generate-categories.ts)
const CATEGORY_PATTERNS = {
  'tech:ai': [/\bai\b/i, /machine learning/i, /llm/i, /gpt/i, /openai/i, /anthropic/i, /claude/i, /chatgpt/i],
  'tech:crypto': [/crypto/i, /bitcoin/i, /ethereum/i, /blockchain/i, /defi/i, /web3/i, /nft/i],
  'tech:data': [/python/i, /javascript/i, /typescript/i, /code/i, /programming/i, /developer/i],
  'tech:security': [/security/i, /hack/i, /privacy/i, /cyber/i, /encryption/i],
  'tech:hardware': [/chip/i, /semiconductor/i, /hardware/i, /gpu/i, /cpu/i, /nvidia/i],
  'business:startups': [/startup/i, /founder/i, /entrepreneur/i, /\byc\b/i, /venture capital/i],
  'business:markets': [/market/i, /stock/i, /trading/i, /investing/i, /economy/i, /inflation/i],
  'business:marketing': [/marketing/i, /promotion/i, /seo/i, /growth/i, /\bad\b/i],
  'product:product': [/product management/i, /\bpm\b/i, /ux research/i, /product strategy/i],
  'product:design': [/design/i, /\bui\b.*\bux\b/i, /figma/i, /design system/i],
  'product:gaming': [/gaming/i, /game/i, /esports/i],
  'science:science': [/research/i, /study/i, /physics/i, /chemistry/i, /biology/i],
  'science:health': [/health/i, /medical/i, /medicine/i, /wellness/i],
  'science:education': [/education/i, /learning/i, /school/i, /university/i],
  'science:environment': [/climate/i, /environment/i, /sustainability/i],
  'culture:media': [/journalism/i, /media/i, /news/i, /twitter/i],
  'culture:culture': [/culture/i, /society/i, /trend/i],
  'culture:philosophy': [/philosophy/i, /ethics/i, /thinking/i],
  'culture:history': [/history/i, /historical/i],
  'culture:policy': [/policy/i, /politics/i, /government/i],
  'culture:personal-story': [/my story/i, /personal/i]
}

function generateCategoryByKeywords(title: string, titleEnglish: string | null) {
  const titleToUse = titleEnglish || title
  const lowerTitle = titleToUse.toLowerCase()

  for (const [combined, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    for (const regex of keywords) {
      if (regex.test(lowerTitle)) {
        const [main, sub] = combined.split(':')
        return { main_category: main, sub_category: sub, category_combined: combined }
      }
    }
  }

  // Default fallback
  return { main_category: 'tech', sub_category: 'ai', category_combined: 'tech:ai' }
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
          const newSlug = generateSlug(article.title, analysis.title_english, article.tweet_id)
          const category = generateCategoryByKeywords(article.title, analysis.title_english)

          if (analysis.summary_skipped) {
            const updateData: {
              title_english: string | null
              slug: string
              language: string
              category: string
              main_category: string
              sub_category: string
            } = {
              title_english: analysis.title_english,
              slug: newSlug,
              language: analysis.language,
              category: category.category_combined,
              main_category: category.main_category,
              sub_category: category.sub_category
            }

            const { error } = await supabase.from('articles').update(updateData).eq('title', article.title)

            if (error) {
              ctx.logs.push({
                timestamp: new Date(),
                level: 'warn',
                step: 'save-summaries',
                message: `Failed to update short article: ${article.title} - ${error.message}`
              })
              failed++
            } else {
              saved++
            }
            skipped++
            continue
          }

          const updateData: {
            summary_chinese: string
            summary_english: string
            title_english: string | null
            language: string
            slug: string
            summary_generated_at: string
            category: string
            main_category: string
            sub_category: string
          } = {
            summary_chinese: analysis.summary_chinese,
            summary_english: analysis.summary_english,
            title_english: analysis.title_english,
            language: analysis.language,
            slug: newSlug,
            summary_generated_at: new Date().toISOString(),
            category: category.category_combined,
            main_category: category.main_category,
            sub_category: category.sub_category
          }

          const { error } = await supabase.from('articles').update(updateData).eq('title', article.title)

          if (error) {
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
        message: `Saved ${saved} summaries, ${skipped} skipped, ${failed} failed`
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
