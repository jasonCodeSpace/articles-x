import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '')

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Get today's articles to generate contextual description
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('title, category, summary')
      .gte('published_at', today)
      .lt('published_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .limit(10)
    
    let contextInfo = ''
    if (articles && articles.length > 0) {
      const categories = [...new Set(articles.map(a => a.category).filter(Boolean))]
      const titles = articles.slice(0, 3).map(a => a.title).join(', ')
      contextInfo = `Today's articles cover: ${categories.join(', ')}. Sample titles: ${titles}`
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const prompt = `Generate a compelling, concise description (maximum 120 characters) for today's daily summary card that showcases curated articles from X (Twitter). 

${contextInfo ? `Context about today's content: ${contextInfo}` : 'No specific articles available yet.'}

The description should:
1. Be relevant to today's actual content if available
2. Highlight that it's today's curated content
3. Be engaging and professional
4. Use active voice
5. Stay under 120 characters

Return only the description text, no quotes or additional formatting.`

    const result = await model.generateContent(prompt)
    const description = result.response.text().trim()
    
    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'