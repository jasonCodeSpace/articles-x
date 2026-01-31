/**
 * Step: Generate Article Categories
 * Uses keyword matching + DeepSeek fallback
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { createClient } from '@supabase/supabase-js'

export interface CategoryAssignment {
  main_category: string
  sub_category: string
  category_combined: string
}

export interface GenerateCategoriesInput {
  articleIds?: string[]
}

export interface GenerateCategoriesOutput {
  processed: number
  failed: number
  skipped: number
}

// Category keyword patterns
const CATEGORY_PATTERNS = {
  'tech:ai': {
    main: 'tech',
    sub: 'ai',
    keywords: [/\bai\b/i, /machine learning/i, /llm/i, /gpt/i, /openai/i, /anthropic/i, /claude/i, /chatgpt/i, /neural/i, /deep learning/i, /transformer/i]
  },
  'tech:crypto': {
    main: 'tech',
    sub: 'crypto',
    keywords: [/crypto/i, /bitcoin/i, /ethereum/i, /blockchain/i, /defi/i, /web3/i, /nft/i, /token/i, /\bcoin\b/i]
  },
  'tech:data': {
    main: 'tech',
    sub: 'data',
    keywords: [/python/i, /javascript/i, /typescript/i, /code/i, /programming/i, /developer/i, /coding/i, /data science/i, /analytics/i]
  },
  'tech:security': {
    main: 'tech',
    sub: 'security',
    keywords: [/security/i, /hack/i, /privacy/i, /cyber/i, /encryption/i, /vulnerability/i, /breach/i]
  },
  'tech:hardware': {
    main: 'tech',
    sub: 'hardware',
    keywords: [/chip/i, /semiconductor/i, /hardware/i, /device/i, /gpu/i, /cpu/i, /nvidia/i]
  },
  'business:startups': {
    main: 'business',
    sub: 'startups',
    keywords: [/startup/i, /founder/i, /entrepreneur/i, /\byc\b/i, /venture capital/i, /pitch/i, /bootstrapping/i, /series a/i, /seed round/i]
  },
  'business:markets': {
    main: 'business',
    sub: 'markets',
    keywords: [/market/i, /stock/i, /trading/i, /investing/i, /economy/i, /inflation/i, /recession/i, /fed/i, /dividend/i]
  },
  'business:marketing': {
    main: 'business',
    sub: 'marketing',
    keywords: [/marketing/i, /promotion/i, /seo/i, /social media/i, /growth/i, /\bad\b/i, /funnel/i]
  },
  'product:product': {
    main: 'product',
    sub: 'product',
    keywords: [/product management/i, /\bpm\b/i, /ux research/i, /product strategy/i, /roadmap/i, /kpi/i, /metrics/i]
  },
  'product:design': {
    main: 'product',
    sub: 'design',
    keywords: [/design/i, /\bui\b.*\bux\b/i, /ux design/i, /figma/i, /design system/i, /typography/i, /branding/i]
  },
  'product:gaming': {
    main: 'product',
    sub: 'gaming',
    keywords: [/gaming/i, /game/i, /esports/i, /playstation/i, /xbox/i, /nintendo/i]
  },
  'science:science': {
    main: 'science',
    sub: 'science',
    keywords: [/research/i, /study/i, /physics/i, /chemistry/i, /biology/i, /scientific/i, /paper/i, /journal/i]
  },
  'science:health': {
    main: 'science',
    sub: 'health',
    keywords: [/health/i, /medical/i, /medicine/i, /wellness/i, /mental health/i, /doctor/i, /hospital/i, /fitness/i]
  },
  'science:education': {
    main: 'science',
    sub: 'education',
    keywords: [/education/i, /learning/i, /school/i, /university/i, /course/i, /tutorial/i]
  },
  'science:environment': {
    main: 'science',
    sub: 'environment',
    keywords: [/climate/i, /environment/i, /sustainability/i, /carbon/i, /green energy/i]
  },
  'culture:media': {
    main: 'culture',
    sub: 'media',
    keywords: [/journalism/i, /media/i, /news/i, /twitter/i, /\bx\b/i, /social platform/i]
  },
  'culture:culture': {
    main: 'culture',
    sub: 'culture',
    keywords: [/culture/i, /society/i, /trend/i, /generation/i]
  },
  'culture:philosophy': {
    main: 'culture',
    sub: 'philosophy',
    keywords: [/philosophy/i, /ethics/i, /thinking/i, /mindset/i, /wisdom/i]
  },
  'culture:history': {
    main: 'culture',
    sub: 'history',
    keywords: [/history/i, /historical/i, /past/i, /lesson/i]
  },
  'culture:policy': {
    main: 'culture',
    sub: 'policy',
    keywords: [/policy/i, /politics/i, /government/i, /regulation/i, /law/i, /election/i]
  },
  'culture:personal-story': {
    main: 'culture',
    sub: 'personal-story',
    keywords: [/my story/i, /personal/i, / memoir/i, /autobiography/i]
  }
}

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables not set')
  }
  return createClient(supabaseUrl, serviceKey)
}

/**
 * Generate category for a single article using keyword matching
 */
function generateCategoryByKeywords(title: string, titleEnglish: string | null): CategoryAssignment {
  const titleToUse = titleEnglish || title
  const lowerTitle = titleToUse.toLowerCase()

  // Find matching category by keywords
  for (const [combined, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    for (const regex of pattern.keywords) {
      if (regex.test(lowerTitle)) {
        return {
          main_category: pattern.main,
          sub_category: pattern.sub,
          category_combined: combined
        }
      }
    }
  }

  // Default fallback
  return {
    main_category: 'tech',
    sub_category: 'ai',
    category_combined: 'tech:ai'
  }
}

export const generateCategoriesStep = createStep<GenerateCategoriesInput, GenerateCategoriesOutput>(
  'generate-categories',
  async (input: GenerateCategoriesInput, ctx: WorkflowContext): Promise<StepResult<GenerateCategoriesOutput>> => {
    try {
      const supabase = createServiceRoleClient()
      
      let query
      
      if (input.articleIds && input.articleIds.length > 0) {
        query = supabase
          .from('articles')
          .select('id, title, title_english, category')
          .in('id', input.articleIds)
      } else {
        query = supabase
          .from('articles')
          .select('id, title, title_english, category')
          .eq('indexed', true)
          .is('category', null)
          .order('updated_at', { ascending: false })
          .limit(50)
      }

      const { data: articles, error } = await query

      if (error) {
        return {
          success: false,
          error: new Error(`Database query failed: ${error.message}`)
        }
      }

      if (!articles || articles.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No articles to categorize'
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'generate-categories',
        message: `Categorizing ${articles.length} articles...`
      })

      let processed = 0
      let failed = 0
      const skipped = 0

      for (const article of articles) {
        try {
          const categoryAssignment = generateCategoryByKeywords(
            article.title,
            article.title_english
          )

          const { error: updateError } = await supabase
            .from('articles')
            .update({
              category: categoryAssignment.category_combined,
              main_category: categoryAssignment.main_category,
              sub_category: categoryAssignment.sub_category,
              updated_at: new Date().toISOString()
            })
            .eq('id', article.id)

          if (updateError) {
            ctx.logs.push({
              timestamp: new Date(),
              level: 'warn',
              step: 'generate-categories',
              message: `Failed to save category for ${article.title}: ${updateError.message}`
            })
            failed++
          } else {
            processed++
            ctx.logs.push({
              timestamp: new Date(),
              level: 'info',
              step: 'generate-categories',
              message: `Categorized ${article.title.substring(0, 40)}... -> ${categoryAssignment.category_combined}`
            })
          }
        } catch (error) {
          ctx.logs.push({
            timestamp: new Date(),
            level: 'warn',
            step: 'generate-categories',
            message: `Error categorizing ${article.title}: ${error}`
          })
          failed++
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'generate-categories',
        message: `Category generation complete: ${processed} processed, ${skipped} skipped, ${failed} failed`
      })

      return {
        success: true,
        data: { processed, failed, skipped }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to generate categories'
      }
    }
  },
  { retries: 1, retryDelay: 3000, optional: true }
)
