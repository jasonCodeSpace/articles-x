import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callDeepSeek } from '@/lib/deepseek'

const CRON_SECRET = process.env.CRON_SECRET

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables not set')
  }
  return createClient(supabaseUrl, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      )
    }

    const supabase = createServiceClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get articles from past 24 hours with summaries
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, title_english, summary_english, summary_chinese, author_name, author_handle, tweet_views, article_published_at')
      .gte('article_published_at', twentyFourHoursAgo.toISOString())
      .not('summary_english', 'is', null)
      .not('summary_english', 'eq', '')
      .order('tweet_views', { ascending: false, nullsFirst: false })

    if (articlesError || !articles || articles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No articles with summaries found in the past 24 hours',
        date: today
      })
    }

    // Get top 10 articles for the report
    const topArticles = articles.slice(0, 10)

    // Build articles list for the prompt
    const articlesList = topArticles.map((a, index) => {
      const views = a.tweet_views?.toLocaleString() || 'N/A'
      const author = a.author_name || a.author_handle || 'Unknown'
      return `${index + 1}. "${a.title_english || a.title}" by ${author} (${views} views)\n   ${a.summary_english}`
    }).join('\n\n')

    // Generate structured daily report
    const prompt = `You are creating a daily report for ${today} based on ${articles.length} articles published in the past 24 hours.

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

    // Upsert to new daily_summary schema
    const { error: upsertError } = await supabase
      .from('daily_summary')
      .upsert({
        date: today,
        summary_en,
        summary_zh,
        summary_created_at: new Date().toISOString()
      }, {
        onConflict: 'date'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting daily summary:', upsertError)
      return NextResponse.json(
        { error: 'Failed to upsert daily summary', details: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Daily summary generated successfully',
      date: today,
      articlesCount: articles.length,
      summary_en_length: summary_en.length,
      summary_zh_length: summary_zh.length
    })

  } catch (error) {
    console.error('Error generating daily summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily summary', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
