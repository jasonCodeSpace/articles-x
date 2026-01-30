import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Maximum articles allowed per day
const MAX_DAILY_ARTICLES = 7

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Count indexed articles published today
    const { data, error } = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('indexed', true)
      .gte('article_published_at', todayISO)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const todayCount = data?.length || 0
    const canPublish = todayCount < MAX_DAILY_ARTICLES
    const remaining = Math.max(0, MAX_DAILY_ARTICLES - todayCount)

    return NextResponse.json({
      canPublish,
      todayCount,
      maxDaily: MAX_DAILY_ARTICLES,
      remaining,
      message: canPublish
        ? `Can publish ${remaining} more article(s) today`
        : `Daily limit reached (${MAX_DAILY_ARTICLES} articles). Try again after midnight.`
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
