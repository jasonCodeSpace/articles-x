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

export interface MultiCategoryAssignment {
  primary: CategoryAssignment
  categories: string[]  // All matching categories, e.g., ['tech:ai', 'tech:data']
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
const CATEGORY_PATTERNS: Record<string, { main: string; sub: string; keywords: RegExp[] }> = {
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
    keywords: [
      /python/i,
      /javascript/i,
      /typescript/i,
      /\bcode\b/i,
      /programming/i,
      /developer/i,
      /coding/i,
      /data science/i,
      /analytics/i,
      /guide/i,
      /tutorial/i,
      /how to/i,
      /plugin/i,
      /extension/i,
      /tool/i,
      /framework/i,
      /library/i,
      /api/i,
      /software/i,
      /app/i,
      /platform/i,
      /agentic/i,
      /automation/i
    ]
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
    keywords: [
      /market/i,
      /stock/i,
      /trading/i,
      /investing/i,
      /economy/i,
      /inflation/i,
      /recession/i,
      /fed/i,
      /dividend/i,
      /money/i,
      /wealth/i,
      /financial/i,
      /finance/i,
      /\bbroke\b/i,
      /poor/i,
      /rich/i,
      /income/i,
      /salary/i,
      /earn/i,
      /saving/i,
      /debt/i
    ]
  },
  'business:marketing': {
    main: 'business',
    sub: 'marketing',
    keywords: [
      /marketing/i,
      /promotion/i,
      /seo/i,
      /social media marketing/i,
      /growth hacking/i,
      /sales funnel/i,
      /conversion/i,
      /campaign/i,
      /audience/i,
      /brand/i,
      /advertising/i,
      /advertisement/i,
      /lead generation/i,
      /customer acquisition/i,
      /email marketing/i,
      /content marketing/i
    ]
  },
  'product:product': {
    main: 'product',
    sub: 'product',
    keywords: [
      /product management/i,
      /\bpm\b/i,
      /ux research/i,
      /product strategy/i,
      /roadmap/i,
      /kpi/i,
      /metrics/i,
      /user research/i,
      /feature/i,
      /mvp/i,
      /product launch/i,
      /iteration/i,
      /\bokr/i,
      /data driven/i,
      /user feedback/i
    ]
  },
  'product:design': {
    main: 'product',
    sub: 'design',
    keywords: [
      /ux/i,
      /ui/i,
      /design/i,
      /figma/i,
      /design system/i,
      /typography/i,
      /branding/i,
      /wireframe/i,
      /prototype/i,
      /user interface/i,
      /user experience/i,
      /visual design/i,
      /interaction/i,
      /usability/i
    ]
  },
  'product:gaming': {
    main: 'product',
    sub: 'gaming',
    keywords: [
      /gaming/i,
      /game/i,
      /esports/i,
      /playstation/i,
      /xbox/i,
      /nintendo/i,
      /steam/i,
      /player/i,
      /gameplay/i,
      /rpg/i,
      /fps/i,
      /console/i,
      /nintendo/i,
      /mobile game/i,
      /indie game/i
    ]
  },
  'science:science': {
    main: 'science',
    sub: 'science',
    keywords: [
      /physics/i,
      /chemistry/i,
      /biology/i,
      /\bscientific\b/i,
      /science/i,
      /experiment/i,
      /laboratory/i,
      /hypothesis/i,
      /quantum/i,
      /molecule/i,
      /genome/i,
      /neuron science/i,
      /astrophysics/i,
      /microscope/i
    ]
  },
  'science:health': {
    main: 'science',
    sub: 'health',
    keywords: [
      /medical/i,
      /medicine/i,
      /doctor/i,
      /hospital/i,
      /disease/i,
      /treatment/i,
      /patient/i,
      /clinical/i,
      /drug trial/i,
      /healthcare/i,
      /diagnosis/i,
      /symptom/i,
      /virus/i,
      /bacteria/i
    ]
  },
  'science:education': {
    main: 'science',
    sub: 'education',
    keywords: [
      /education/i,
      /school/i,
      /university/i,
      /college/i,
      /student/i,
      /teacher/i,
      /professor/i,
      /classroom/i,
      /curriculum/i,
      /academic/i,
      /degree/i,
      /scholarship/i
    ]
  },
  'science:environment': {
    main: 'science',
    sub: 'environment',
    keywords: [
      /climate/i,
      /environment/i,
      /sustainability/i,
      /carbon/i,
      /green energy/i,
      /pollution/i,
      /renewable/i,
      /fossil fuel/i,
      /global warming/i,
      /emission/i,
      /solar/i,
      /wind energy/i,
      /ecosystem/i,
      /biodiversity/i,
      /conservation/i,
      /recycling/i
    ]
  },
  'culture:media': {
    main: 'culture',
    sub: 'media',
    keywords: [/journalism/i, /media/i, /news/i, /twitter/i, /\bx\b/i, /social platform/i]
  },
  'culture:culture': {
    main: 'culture',
    sub: 'culture',
    keywords: [
      /pop culture/i,
      /cultural/i,
      /trend/i,
      /generation/i,
      /social media/i,
      /internet culture/i,
      /meme/i,
      /viral/i,
      /influencer/i,
      /celebrity/i,
      /entertainment/i
    ]
  },
  'culture:philosophy': {
    main: 'culture',
    sub: 'philosophy',
    keywords: [
      /philosophy/i,
      /ethics/i,
      /thinking/i,
      /mindset/i,
      /wisdom/i,
      /shame/i,
      /moral/i,
      /survival/i,
      /human nature/i,
      /society/i,
      /social/i,
      /gratitude/i,
      /\blife\b/i,
      /habit/i,
      /productivity/i,
      /happiness/i,
      /meaning/i,
      /purpose/i,
      /goal/i,
      /motivation/i,
      /love/i,
      /relationship/i,
      /emotion/i,
      /feeling/i,
      /healing/i
    ]
  },
  'culture:history': {
    main: 'culture',
    sub: 'history',
    keywords: [
      /history/i,
      /historical/i,
      /\bin the past\b/i,
      /century/i,
      /decade/i,
      /era/i,
      /ancient/i,
      /medieval/i,
      /war/i,
      /revolution/i,
      /empire/i,
      /civilization/i,
      /heritage/i,
      /legacy/i,
      /origin/i
    ]
  },
  'culture:policy': {
    main: 'culture',
    sub: 'policy',
    keywords: [/policy/i, /politics/i, /government/i, /regulation/i, /law/i, /election/i]
  },
  'culture:personal-story': {
    main: 'culture',
    sub: 'personal-story',
    keywords: [
      /my story/i,
      /my journey/i,
      /personal/i,
      /memoir/i,
      /autobiography/i,
      /i learned/i,
      /my experience/i,
      /life story/i,
      /personal essay/i,
      /reflect/i,
      /my life/i
    ]
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
 * Generate all matching categories for a single article using keyword matching
 * Uses title AND summary (AI-generated) for more accurate classification
 * Returns multiple categories with the first match as primary
 */
function generateCategoriesByKeywords(
  title: string,
  titleEnglish: string | null,
  summaryEnglish: string | null = null,
  summaryChinese: string | null = null
): MultiCategoryAssignment {
  const titleToUse = titleEnglish || title

  // Combine title and summaries for better matching
  // Summary gives more context about the actual content
  const searchContent = [
    titleToUse,
    summaryEnglish || '',
    summaryChinese || ''
  ].join(' ').toLowerCase()

  const matchedCategories: Array<{combined: string, score: number, titleMatch: boolean}> = []

  // Find all matching categories by keywords
  for (const [combined, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    let matchCount = 0
    let hasTitleMatch = false

    for (const regex of pattern.keywords) {
      if (regex.test(searchContent)) {
        matchCount++
        // Check if match was in title (higher weight)
        if (regex.test(titleToUse.toLowerCase())) {
          hasTitleMatch = true
        }
      }
    }

    if (matchCount > 0) {
      // Bonus score for title matches
      const finalScore = matchCount + (hasTitleMatch ? 1 : 0)
      matchedCategories.push({ combined, score: finalScore, titleMatch: hasTitleMatch })
    }
  }

  // Sort by score (more specific matches first), prioritize title matches
  matchedCategories.sort((a, b) => {
    if (a.titleMatch && !b.titleMatch) return -1
    if (!a.titleMatch && b.titleMatch) return 1
    return b.score - a.score
  })

  // If no matches, use default culture category
  if (matchedCategories.length === 0) {
    const defaultCategory = 'culture:culture'
    return {
      primary: {
        main_category: 'culture',
        sub_category: 'culture',
        category_combined: defaultCategory
      },
      categories: [defaultCategory]
    }
  }

  // Extract category IDs from matches
  const categoryIds = matchedCategories.map(m => m.combined)

  // Get primary category details
  const primaryPattern = CATEGORY_PATTERNS[matchedCategories[0].combined]

  return {
    primary: {
      main_category: primaryPattern.main,
      sub_category: primaryPattern.sub,
      category_combined: matchedCategories[0].combined
    },
    categories: categoryIds
  }
}

/**
 * Generate category for a single article using keyword matching (legacy function for backwards compatibility)
 */
function generateCategoryByKeywords(
  title: string,
  titleEnglish: string | null,
  summaryEnglish: string | null = null
): CategoryAssignment {
  const result = generateCategoriesByKeywords(title, titleEnglish, summaryEnglish)
  return result.primary
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
          .select('id, title, title_english, category, summary_english, summary_chinese')
          .in('id', input.articleIds)
      } else {
        query = supabase
          .from('articles')
          .select('id, title, title_english, category, summary_english, summary_chinese')
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
          const categoryAssignment = generateCategoriesByKeywords(
            article.title,
            article.title_english,
            article.summary_english,
            article.summary_chinese || null
          )

          // Update the article with primary category
          const { error: updateError } = await supabase
            .from('articles')
            .update({
              category: categoryAssignment.primary.category_combined,
              main_category: categoryAssignment.primary.main_category,
              sub_category: categoryAssignment.primary.sub_category,
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
            // Insert all categories into article_categories junction table
            const categoryInserts = categoryAssignment.categories.map((cat, index) => ({
              article_id: article.id,
              category: cat,
              is_primary: index === 0  // First category is primary
            }))

            const { error: junctionError } = await supabase
              .from('article_categories')
              .upsert(categoryInserts, { onConflict: 'article_id,category' })

            if (junctionError) {
              ctx.logs.push({
                timestamp: new Date(),
                level: 'warn',
                step: 'generate-categories',
                message: `Failed to save junction categories for ${article.title}: ${junctionError.message}`
              })
            }

            processed++
            const categoryList = categoryAssignment.categories.join(', ')
            ctx.logs.push({
              timestamp: new Date(),
              level: 'info',
              step: 'generate-categories',
              message: `Categorized ${article.title.substring(0, 40)}... -> [${categoryList}]`
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
