import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { GoogleGenerativeAI } from '@google/generative-ai'

const CRON_SECRET = process.env.CRON_SECRET
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '')

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

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const supabase = createServiceClient()
    const today = new Date().toISOString().split('T')[0]

    // Get articles with tag 'Day'
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, summary_english, summary_chinese, category, tweet_views, author_name, article_url, article_published_at')
      .eq('tag', 'Day')
      .not('summary_english', 'is', null)
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

    // Generate summary using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const articlesText = articles.map(a => 
      `Title: ${a.title}\nSummary: ${a.summary_english || a.summary_chinese}\nCategory: ${a.category}`
    ).join('\n\n')
    
    const prompt = `Role 
You are the editor for Xarticle. Generate a concise, factual daily brief from today's articles. No emojis. Output two JSON objects: one for English ("lang":"en") and one for Chinese ("lang":"zh"). Do not output anything else. 

Input fields per article 
id, title, author_name, category, summary_english, url?, published_at? 

Sections & lengths 

key_data_points: 6–10 bullets with numbers 

watchlist: 5 bullets (project/product + what to watch + why it matters) 

policy_media_security: 4–7 bullets 

other_quick_reads: 6–10 bullets (science/culture/design/education/health/gaming etc.) 
Target total per language: ~450–700 words. 

Selection rules 

Prefer hard metrics: volume, users/MAU/DAU, retention, TVL, tx count, service area, growth %, funding, dates/milestones. 

Cover broadly: AI×Crypto infrastructure, consumer adoption, policy/security, major company moves; ensure ≥5 distinct domains overall. 

Deduplicate overlaps; keep the most conservative or newest figure. 

Compact numbers: 5.9M, $20B+, 0.5–0.7M, 30×, 190 sq mi. 

Use precise terms (translate accurately in zh): service area, retention, mainnet, badge, liquidity rewards, TVL, prediction market, rollup. 

Prefer items from today / last 72h; avoid hype and unverifiable claims. 

Formatting rules 

Return exactly two code-fenced JSON objects (no Markdown outside code fences). 

Keys must appear in both languages and in this order. 

Schema 

{ 
  "lang": "en", 
  "date": "${today}", 
  "counts": { "articles_total": ${articles.length} }, 
  "sections": { 
    "key_data_points": ["..."], 
    "watchlist": ["..."], 
    "policy_media_security": ["..."], 
    "other_quick_reads": ["..."] 
  }, 
  "meta": { 
    "domains_covered": ["AI Infra","Crypto/DeFi","Policy/Security","Business/Markets","Science/Health","Media/Culture","Gaming/Product"], 
    "notes": "Numbers normalized; duplicates merged" 
  } 
} 

Chinese object uses identical structure with "lang":"zh" and translated content. 

Now produce the two JSON objects using today's articles:

${articlesText}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()
    
    // Parse the JSON objects from the response
    let summaryJsonEn = null
    let summaryJsonZh = null
    let summaryContent = responseText // fallback to original text
    
    try {
      // Extract JSON objects from code fences
      const jsonMatches = responseText.match(/```json\s*([\s\S]*?)\s*```/g)
      if (jsonMatches && jsonMatches.length >= 1) {
        const firstJsonText = jsonMatches[0].replace(/```json\s*|\s*```/g, '').trim()
        const firstJson = JSON.parse(firstJsonText)
        
        if (jsonMatches.length >= 2) {
          // Two JSON objects found
          const secondJsonText = jsonMatches[1].replace(/```json\s*|\s*```/g, '').trim()
          const secondJson = JSON.parse(secondJsonText)
          
          if (firstJson.lang === 'en') {
            summaryJsonEn = firstJson
            summaryJsonZh = secondJson
          } else {
            summaryJsonEn = secondJson
            summaryJsonZh = firstJson
          }
        } else {
          // Only one JSON object found, determine language
          if (firstJson.lang === 'en') {
            summaryJsonEn = firstJson
          } else if (firstJson.lang === 'zh') {
            summaryJsonZh = firstJson
          } else {
            // Default to English if lang is not specified
            summaryJsonEn = firstJson
          }
        }
        
        // Generate a clean summary content
        if (summaryJsonEn && summaryJsonZh) {
          summaryContent = `English Summary:\n${JSON.stringify(summaryJsonEn, null, 2)}\n\nChinese Summary:\n${JSON.stringify(summaryJsonZh, null, 2)}`
        } else if (summaryJsonEn) {
          summaryContent = `English Summary:\n${JSON.stringify(summaryJsonEn, null, 2)}`
        } else if (summaryJsonZh) {
          summaryContent = `Chinese Summary:\n${JSON.stringify(summaryJsonZh, null, 2)}`
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON objects from response, using raw text:', parseError)
    }
    
    // Upsert daily summary (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('daily_summary')
      .upsert({
        date: today,
        summary_content: summaryContent,
        summary_json_en: summaryJsonEn,
        summary_json_zh: summaryJsonZh,
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