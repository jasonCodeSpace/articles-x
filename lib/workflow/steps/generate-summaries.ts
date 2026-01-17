/**
 * Step 4: 生成 AI 摘要（包含翻译）
 * 使用分离的 EN/ZH 调用确保语言纯净
 * 根据文章字数决定是否生成摘要以及摘要长度
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { HarvestedArticle } from '@/lib/ingest'
import { generateEnglishAnalysis, translateToChinese } from '@/lib/deepseek'
import { isEnglish } from '@/lib/url-utils'
import { countWords, getSummaryRequirement } from '@/lib/word-count'
import { createClient } from '@supabase/supabase-js'

export interface GenerateSummariesInput {
  articles: HarvestedArticle[]
  inserted: number
  updated: number
  skipped: number
}

export interface ArticleAnalysisResult {
  summary_english: string
  summary_chinese: string
  title_english: string | null
  category: string
  language: string
  word_count: number
  summary_skipped: boolean
}

export interface ArticleWithSummary {
  article: HarvestedArticle
  analysis: ArticleAnalysisResult
}

export interface GenerateSummariesOutput {
  processed: ArticleWithSummary[]
  failed: string[]
  skipped: Array<{ title: string; reason: string }>
}

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables not set')
  }
  return createClient(supabaseUrl, serviceKey)
}

export const generateSummariesStep = createStep<GenerateSummariesInput, GenerateSummariesOutput>(
  'generate-summaries',
  async (input: GenerateSummariesInput, ctx: WorkflowContext): Promise<StepResult<GenerateSummariesOutput>> => {
    try {
      const { articles } = input
      const processed: ArticleWithSummary[] = []
      const failed: string[] = []
      const skipped: Array<{ title: string; reason: string }> = []

      const supabase = createServiceRoleClient()

      // 获取需要生成摘要的文章（没有摘要的）
      const { data: dbArticles } = await supabase
        .from('articles')
        .select('id, title, full_article_content, summary_chinese, summary_english')
        .in('title', articles.map(a => a.title))
        .is('summary_chinese', null)

      if (!dbArticles || dbArticles.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'All articles already have summaries'
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'generate-summaries',
        message: `Analyzing ${dbArticles.length} articles for summary generation`
      })

      for (const dbArticle of dbArticles) {
        try {
          const content = dbArticle.full_article_content || dbArticle.title

          // 统计字数
          const wordCount = countWords(content)
          const requirement = getSummaryRequirement(wordCount)

          ctx.logs.push({
            timestamp: new Date(),
            level: 'info',
            step: 'generate-summaries',
            message: `Article "${dbArticle.title.substring(0, 40)}..." has ${wordCount} words (${requirement.category})`
          })

          // 如果文章太短，跳过摘要生成
          if (requirement.shouldSkip) {
            ctx.logs.push({
              timestamp: new Date(),
              level: 'info',
              step: 'generate-summaries',
              message: `Skipping summary for "${dbArticle.title.substring(0, 40)}..." - only ${wordCount} words (< 100)`
            })
            skipped.push({
              title: dbArticle.title,
              reason: `Too short (${wordCount} words < 100)`
            })

            // 仍然保存标记为跳过的文章，避免重复处理
            const matchingArticle = articles.find(a => a.title === dbArticle.title)
            if (matchingArticle) {
              processed.push({
                article: matchingArticle,
                analysis: {
                  summary_english: '',
                  summary_chinese: '',
                  title_english: dbArticle.title,
                  category: 'Uncategorized',
                  language: 'en',
                  word_count: wordCount,
                  summary_skipped: true
                }
              })
            }
            continue
          }

          const needsTitleTranslation = !isEnglish(dbArticle.title)
          const detectedLanguage = needsTitleTranslation ? 'zh' : 'en'

          // Call 1: English analysis (with word count context in prompt)
          const englishResult = await generateEnglishAnalysis(
            content,
            dbArticle.title,
            needsTitleTranslation
          )

          // Call 2: Chinese translation
          const summary_chinese = await translateToChinese(englishResult.summary_english)

          const analysis: ArticleAnalysisResult = {
            summary_english: englishResult.summary_english,
            summary_chinese: summary_chinese,
            title_english: needsTitleTranslation ? englishResult.title_english : dbArticle.title,
            category: englishResult.category,
            language: detectedLanguage,
            word_count: wordCount,
            summary_skipped: false
          }

          const matchingArticle = articles.find(a => a.title === dbArticle.title)
          if (matchingArticle) {
            processed.push({ article: matchingArticle, analysis })
          }

          ctx.logs.push({
            timestamp: new Date(),
            level: 'info',
            step: 'generate-summaries',
            message: `Generated ${requirement.category} summary for: ${dbArticle.title.substring(0, 50)}...`
          })

          // 延迟避免 API 限制
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          ctx.logs.push({
            timestamp: new Date(),
            level: 'warn',
            step: 'generate-summaries',
            message: `Failed to generate summary for: ${dbArticle.title} - ${error}`
          })
          failed.push(dbArticle.title)
        }
      }

      if (processed.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No summaries generated'
        }
      }

      // Log summary
      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'generate-summaries',
        message: `Summary generation complete: ${processed.length} processed, ${skipped.length} skipped (<100 words), ${failed.length} failed`
      })

      return {
        success: true,
        data: { processed, failed, skipped }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to generate summaries'
      }
    }
  },
  { retries: 1, retryDelay: 5000, optional: true }
)
