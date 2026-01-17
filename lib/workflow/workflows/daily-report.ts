/**
 * 每日报告工作流 - 每天运行一次
 *
 * 流程:
 * 1. 获取过去24小时内所有已生成的文章摘要
 * 2. 生成结构化的双语日报
 * 3. 保存到新的 daily_summary 表
 */
import { createStep, runWorkflow, WorkflowDefinition, StepResult, WorkflowContext, WorkflowStep } from '../engine'
import { createClient } from '@supabase/supabase-js'
import { callDeepSeek } from '@/lib/deepseek'

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables not set')
  }
  return createClient(supabaseUrl, serviceKey)
}

interface DailyArticle {
  id: string
  title: string
  title_english: string | null
  summary_english: string | null
  summary_chinese: string | null
  author_handle: string | null
  author_name: string | null
  article_published_at: string
  tweet_views: number | null
}

interface FetchDailyArticlesOutput {
  articles: DailyArticle[]
  date: string
}

// Step 1: 获取过去24小时内有摘要的文章
const fetchDailyArticlesStep = createStep<unknown, FetchDailyArticlesOutput>(
  'fetch-daily-articles',
  async (_input: unknown, ctx: WorkflowContext): Promise<StepResult<FetchDailyArticlesOutput>> => {
    try {
      const supabase = createServiceRoleClient()

      // 获取过去24小时的时间范围
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('articles')
        .select('id, title, title_english, summary_english, summary_chinese, author_handle, author_name, article_published_at, tweet_views')
        .gte('article_published_at', twentyFourHoursAgo.toISOString())
        .not('summary_english', 'is', null)
        .not('summary_english', 'eq', '')
        .order('tweet_views', { ascending: false, nullsFirst: false })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || JSON.stringify(error))
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No articles with summaries found in the past 24 hours'
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'fetch-daily-articles',
        message: `Found ${data.length} articles with summaries in the past 24 hours`
      })

      // 格式化日期为 YYYY-MM-DD
      const date = now.toISOString().split('T')[0]

      return {
        success: true,
        data: {
          articles: data as DailyArticle[],
          date
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to fetch daily articles'
      }
    }
  }
)

interface GenerateReportOutput {
  summary_en: string
  summary_zh: string
  date: string
  articleCount: number
}

// Step 2: 生成结构化双语日报
const generateReportStep = createStep<FetchDailyArticlesOutput, GenerateReportOutput>(
  'generate-report',
  async (input: FetchDailyArticlesOutput, ctx: WorkflowContext): Promise<StepResult<GenerateReportOutput>> => {
    try {
      const { articles, date } = input

      // 按浏览量排序，获取前10篇文章作为重点内容
      const topArticles = articles.slice(0, 10)

      // 构建文章摘要列表
      const articlesList = topArticles.map((a, index) => {
        const views = a.tweet_views?.toLocaleString() || 'N/A'
        const author = a.author_name || a.author_handle || 'Unknown'
        return `${index + 1}. "${a.title_english || a.title}" by ${author} (${views} views)\n   ${a.summary_english}`
      }).join('\n\n')

      const prompt = `You are creating a daily report for ${date} based on ${articles.length} articles published in the past 24 hours.

ARTICLES (ordered by views):
${articlesList}

Create a STRUCTURED daily report with excellent formatting and organization. The report should provide an exceptional reading experience.

Generate TWO versions:

1. ENGLISH VERSION (summary_en):
   - Use markdown formatting for structure
   - Start with a compelling headline
   - Include sections: "Top Stories", "Key Themes", "Notable Insights"
   - For "Top Stories", list 3-5 most viewed articles with brief context
   - For "Key Themes", identify 2-3 recurring topics across articles
   - Use bullet points, bold text for emphasis
   - Keep it concise but informative (300-500 words)

2. CHINESE VERSION (summary_zh):
   - Same structure as English version
   - Use professional Simplified Chinese
   - "热门文章" (Top Stories)
   - "关键主题" (Key Themes)
   - "精彩观点" (Notable Insights)
   - Keep it concise but informative (400-600 characters)

OUTPUT FORMAT:
SUMMARY_EN:
[English report with markdown formatting]

SUMMARY_ZH:
[Chinese report with markdown formatting]

Generate the report now:`

      const text = await callDeepSeek(prompt, 3000)

      // Parse the response
      const enMatch = text.match(/SUMMARY_EN:\s*([\s\S]*?)(?=SUMMARY_ZH:|$)/i)
      const zhMatch = text.match(/SUMMARY_ZH:\s*([\s\S]*?)$/i)

      let summary_en = enMatch?.[1]?.trim() || ''
      let summary_zh = zhMatch?.[1]?.trim() || ''

      // Fallback if parsing failed
      if (!summary_en) {
        // Try to find English content
        const lines = text.split('\n').filter(l => l.trim())
        const enStart = lines.findIndex(l => l.includes('SUMMARY_EN'))
        const zhStart = lines.findIndex(l => l.includes('SUMMARY_ZH'))
        if (enStart !== -1 && zhStart !== -1) {
          summary_en = lines.slice(enStart + 1, zhStart).join('\n').trim()
          summary_zh = lines.slice(zhStart + 1).join('\n').trim()
        } else {
          summary_en = text
          summary_zh = text
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'generate-report',
        message: `Generated daily report for ${date}: ${summary_en.length} chars EN, ${summary_zh.length} chars ZH`
      })

      return {
        success: true,
        data: {
          summary_en,
          summary_zh,
          date,
          articleCount: articles.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to generate report'
      }
    }
  },
  { retries: 2, retryDelay: 5000 }
)

interface SaveReportOutput {
  id: string
  date: string
}

// Step 3: 保存日报到新 schema
const saveReportStep = createStep<GenerateReportOutput, SaveReportOutput>(
  'save-report',
  async (input: GenerateReportOutput, ctx: WorkflowContext): Promise<StepResult<SaveReportOutput>> => {
    try {
      const { summary_en, summary_zh, date, articleCount } = input
      const supabase = createServiceRoleClient()

      const { data, error } = await supabase
        .from('daily_summary')
        .upsert({
          date,
          summary_en,
          summary_zh,
          summary_created_at: new Date().toISOString()
        }, { onConflict: 'date' })
        .select('id')
        .single()

      if (error) {
        console.error('Supabase error saving report:', error)
        throw new Error(error.message || JSON.stringify(error))
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'save-report',
        message: `Saved daily report for ${date} (${articleCount} articles summarized)`
      })

      return {
        success: true,
        data: { id: data?.id || 'unknown', date }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to save report'
      }
    }
  }
)

export const dailyReportWorkflow: WorkflowDefinition = {
  name: 'daily-report',
  description: '生成每日文章报告 - 基于过去24小时文章摘要',
  steps: [
    fetchDailyArticlesStep as WorkflowStep,
    generateReportStep as WorkflowStep,
    saveReportStep as WorkflowStep
  ]
}

export async function runDailyReport() {
  console.log('========================================')
  console.log('Starting Daily Report Workflow')
  console.log('========================================')

  const result = await runWorkflow(dailyReportWorkflow)

  console.log('========================================')
  console.log(`Workflow ${result.status}`)
  console.log(`Duration: ${Date.now() - result.startedAt.getTime()}ms`)
  console.log('========================================')

  return result
}
