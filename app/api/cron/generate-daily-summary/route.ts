import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { callDeepSeek } from '@/lib/deepseek'

const CRON_SECRET = process.env.CRON_SECRET

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
    const today = new Date().toISOString().split('T')[0]
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Get articles with tag 'Day'
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, summary_english, summary_chinese, category, tweet_views, author_name, article_url, article_published_at')
      .eq('tag', 'Day')
      .not('summary_english', 'is', null)
      .order('tweet_published_at', { ascending: false })
      .order('tweet_views', { ascending: false })

    if (articlesError || !articles || articles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No articles found for today',
        date: today
      })
    }

    // Find top article by views
    const topArticle = articles[0]

    // Count articles by category
    const categoriesCount: Record<string, number> = {}
    articles.forEach(article => {
      if (article.category) {
        categoriesCount[article.category] = (categoriesCount[article.category] || 0) + 1
      }
    })

    // Prepare articles text for prompt
    const articlesText = articles.map(a =>
      `Title: ${a.title}\nSummary: ${a.summary_english}\nCategory: ${a.category}`
    ).join('\n\n')

    // Step 1: Generate English digest
    const englishDigestPrompt = `Create a daily digest from these article summaries.
Format (no emoji, plain text only):

DAILY DIGEST | ${formattedDate} | ${articles.length} Articles

HIGHLIGHTS

1. [Most important article title]
   [One sentence summary]

2. [Second article title]
   [One sentence summary]

3. [Third article title]
   [One sentence summary]


QUICK READS

- [Brief topic point]
- [Brief topic point]
- [Brief topic point]


KEY NUMBERS

- [Number]: [Context]
- [Number]: [Context]

Articles:
${articlesText}`

    const digestEnglish = await callDeepSeek(englishDigestPrompt, 1500)

    // Step 2: Translate to Chinese
    const chineseDigestPrompt = `将以下英文日报翻译成中文，保持相同格式，不要有emoji：

${digestEnglish}`

    const digestChinese = await callDeepSeek(chineseDigestPrompt, 1500)

    // Combine for storage
    const summaryContent = `=== ENGLISH ===\n\n${digestEnglish}\n\n=== 中文 ===\n\n${digestChinese}`

    // Upsert daily summary
    const { error: upsertError } = await supabase
      .from('daily_summary')
      .upsert({
        date: today,
        summary_content: summaryContent,
        summary_json_en: null, // No longer using JSON format
        summary_json_zh: null,
        top_article_title: topArticle.title,
        top_article_id: topArticle.id,
        total_articles_count: articles.length,
        categories_summary: categoriesCount
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
      topArticle: topArticle.title,
      categories: Object.keys(categoriesCount).length
    })

  } catch (error) {
    console.error('Error generating daily summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily summary' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
