/**
 * 每日报告工作流 - 每天运行一次
 *
 * 流程:
 * 1. 获取当天所有文章
 * 2. 生成 AI 报告
 * 3. 保存报告
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
  category: string | null
  summary_chinese: string | null
  summary_english: string | null
  author_handle: string | null
  article_published_at: string
}

interface FetchDailyArticlesOutput {
  articles: DailyArticle[]
  date: string
}

// Step 1: 获取当天文章
const fetchDailyArticlesStep = createStep<unknown, FetchDailyArticlesOutput>(
  'fetch-daily-articles',
  async (_input: unknown, ctx: WorkflowContext): Promise<StepResult<FetchDailyArticlesOutput>> => {
    try {
      const supabase = createServiceRoleClient()
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

      const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, summary_chinese, summary_english, author_handle, article_published_at')
        .gte('article_published_at', startOfDay)
        .lte('article_published_at', endOfDay)
        .order('article_published_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || JSON.stringify(error))
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No articles found for today'
        }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'fetch-daily-articles',
        message: `Found ${data.length} articles for today`
      })

      return {
        success: true,
        data: {
          articles: data,
          date: new Date().toISOString().split('T')[0]
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
  report: {
    chinese: string
    english: string
  }
  date: string
  articleCount: number
}

// Step 2: 生成报告
const generateReportStep = createStep<FetchDailyArticlesOutput, GenerateReportOutput>(
  'generate-report',
  async (input: FetchDailyArticlesOutput, ctx: WorkflowContext): Promise<StepResult<GenerateReportOutput>> => {
    try {
      const { articles, date } = input

      // 准备文章摘要
      const articleSummaries = articles.map(a =>
        `- ${a.title} (${a.category || 'Uncategorized'}): ${a.summary_chinese || a.summary_english || 'No summary'}`
      ).join('\n')

      const prompt = `Generate a daily digest report for ${date}.

Articles (${articles.length} total):
${articleSummaries}

Generate TWO versions:
1. Chinese version (中文版): 2-3 paragraphs summarizing the day's key themes and highlights
2. English version: 2-3 paragraphs summarizing the day's key themes and highlights

Format:
CHINESE:
[Chinese report here]

ENGLISH:
[English report here]`

      const text = await callDeepSeek(prompt, 2000)

      const chineseMatch = text.match(/CHINESE:\s*([\s\S]*?)(?=ENGLISH:|$)/i)
      const englishMatch = text.match(/ENGLISH:\s*([\s\S]*?)$/i)

      const report = {
        chinese: chineseMatch?.[1]?.trim() || text,
        english: englishMatch?.[1]?.trim() || text
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'generate-report',
        message: `Generated daily report for ${date}`
      })

      return {
        success: true,
        data: { report, date, articleCount: articles.length }
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

// Step 3: 保存报告
const saveReportStep = createStep<GenerateReportOutput, SaveReportOutput>(
  'save-report',
  async (input: GenerateReportOutput, ctx: WorkflowContext): Promise<StepResult<SaveReportOutput>> => {
    try {
      const { report, date, articleCount } = input
      const supabase = createServiceRoleClient()

      // 合并中英文报告作为 summary_content
      const summaryContent = `# Daily Report - ${date}\n\n## 中文版\n${report.chinese}\n\n## English Version\n${report.english}`

      const { data, error } = await supabase
        .from('daily_summary')
        .upsert({
          date,
          summary_content: summaryContent,
          top_article_title: 'Daily Report',
          total_articles_count: articleCount
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
        message: `Saved daily report for ${date}`
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
  description: '生成每日文章报告',
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
